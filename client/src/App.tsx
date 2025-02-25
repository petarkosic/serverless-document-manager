import axios from 'axios';
import { useState } from 'react';
import './App.css';

interface IMetadata {
	fileID: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	uploadTime: string;
	contentType: string;
	lastModified: string;
}

// LocalStack-only feature: A custom, static API ID for consistent URLs
const API_ID = 'documentapi';

const FileUploadForm = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<string>('');

	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<IMetadata | null>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setSelectedFile(event.target.files[0]);
		}
	};

	const fetchMetadata = async (fileID: string) => {
		try {
			const response = await axios.get(
				`http://localhost:4566/restapis/${API_ID}/dev/_user_request_/metadata/${fileID}`
			);

			setMetadata(response.data);
		} catch (error) {
			console.error('Error fetching metadata:', error);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!selectedFile) {
			setUploadStatus('Please select a file first.');
			return;
		}

		try {
			setUploadStatus('Uploading...');

			const response = await axios.post(
				'http://localhost:5000/get-presigned-url',
				{
					fileName: selectedFile.name,
					fileType: selectedFile.type,
				}
			);

			await axios.put(response.data.url, selectedFile, {
				headers: {
					'Content-Type': selectedFile.type,
				},
			});

			const imageUrl = response.data.url.split('?')[0];
			setImageUrl(imageUrl);

			await fetchMetadata(response.data.key);

			if (response.status === 200) {
				setUploadStatus(`File uploaded successfully! ID ${response.data.key}`);
			} else {
				setUploadStatus('Upload failed');
			}
		} catch (error) {
			console.error('Upload error:', error);
			setUploadStatus('Upload failed. Please try again.');
		}
	};

	return (
		<div className='wrapper'>
			<div className='form-container'>
				<div className='file-upload-container'>
					<form onSubmit={handleSubmit}>
						<input
							type='file'
							onChange={handleFileSelect}
							name='file'
							style={{
								marginBottom: '1rem',
								width: '100%',
							}}
						/>
						<button type='submit'>Upload File</button>
					</form>
					{uploadStatus && (
						<div
							className='upload-status'
							style={{
								color: uploadStatus.includes('successfully') ? 'green' : 'red',
							}}
						>
							{uploadStatus}
						</div>
					)}
				</div>
				{metadata && (
					<div className='metadata-container'>
						<p>File Name: {metadata.fileName}</p>
						<p>File Type: {metadata.fileType}</p>
						<p>Content Type: {metadata.contentType}</p>
						<p>File Size: {metadata.fileSize / 1000} KB</p>{' '}
						<p>Upload Time: {new Date(metadata.uploadTime).toLocaleString()}</p>
					</div>
				)}
			</div>

			{imageUrl && (
				<div className='image-container'>
					<img src={imageUrl} />
				</div>
			)}
		</div>
	);
};

export default FileUploadForm;
