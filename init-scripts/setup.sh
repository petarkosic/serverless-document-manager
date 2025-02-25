#!/bin/bash
set -e

AWS_PROFILE=localstack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localstack:4566


awslocal s3 mb s3://document-manager

awslocal s3api put-bucket-cors --bucket document-manager --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"]
    }
  ]
}'

awslocal s3api put-bucket-policy --bucket document-manager --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::document-manager/*"]
    }
  ]
}'

awslocal dynamodb create-table \
  --table-name Documents \
  --attribute-definitions AttributeName=fileID,AttributeType=S \
  --key-schema AttributeName=fileID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

awslocal iam create-role --role-name lambda-role --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}'

awslocal iam put-role-policy --role-name lambda-role --policy-name DocumentAccess --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:s3:::document-manager/*",
        "arn:aws:dynamodb:us-east-1:000000000000:table/Documents"
      ]
    }
  ]
}'

create_lambda() {
  local function_name=$1
  local handler_file=$2
  local zip_file="handler-file.zip"
  
  cd lambda/${function_name}
  zip -r ${zip_file} .
  cd ../..

  awslocal lambda create-function \
    --function-name ${function_name} \
    --runtime nodejs18.x \
    --handler ${handler_file}.handler \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --zip-file fileb://lambda/${function_name}/${zip_file} \
    --timeout 30 \
    --memory-size 128
}

create_lambda MetadataExtractor metadata-extractor
create_lambda GetMetadata get-metadata

awslocal lambda wait function-active --function-name MetadataExtractor
awslocal lambda wait function-active --function-name GetMetadata

awslocal lambda add-permission \
  --function-name MetadataExtractor \
  --statement-id s3-trigger-permission \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::document-manager

awslocal s3api put-bucket-notification-configuration \
  --bucket document-manager \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "Id": "MetadataExtractor",
        "LambdaFunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:MetadataExtractor",
        "Events": ["s3:ObjectCreated:*"]
      }
    ]
  }'

# LocalStack-only feature: Set a custom, static API ID for consistent URLs
API_ID=$(awslocal apigateway create-rest-api --name 'DocumentAPI' --description 'Document Metadata API' --tags '{"_custom_id_": "documentapi"}' --output text --query 'id')
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)

awslocal lambda add-permission \
  --function-name GetMetadata \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:000000000000:${API_ID}/*/GET/metadata/*"

# Create /metadata/{fileId} resource
RESOURCE_ID=$(awslocal apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part "metadata" --output text --query 'id')

FILE_ID_RESOURCE=$(awslocal apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RESOURCE_ID \
  --path-part "{fileID+}" --output text --query 'id')

awslocal apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $FILE_ID_RESOURCE \
  --http-method GET \
  --authorization-type NONE

awslocal apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $FILE_ID_RESOURCE \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:GetMetadata/invocations" 

awslocal apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name dev

echo "API Gateway URL: http://localstack:4566/restapis/${API_ID}/dev/_user_request_/metadata"

echo "AWS resources created successfully!"