import axios from 'axios';
import { useState } from 'react';

const FileUploadForm = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState('');

	const [imageUrl, setImageUrl] = useState(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setSelectedFile(event.target.files[0]);
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
		<div
			className='file-upload-container'
			style={{
				maxWidth: '400px',
				margin: '2rem auto',
				padding: '2rem',
				backgroundColor: '#f4f4f4',
				borderRadius: '8px',
				boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
			}}
		>
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
				<button
					type='submit'
					style={{
						width: '100%',
						padding: '0.5rem',
						backgroundColor: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Upload File
				</button>
			</form>
			{uploadStatus && (
				<div
					style={{
						marginTop: '1rem',
						textAlign: 'center',
						color: uploadStatus.includes('successfully') ? 'green' : 'red',
					}}
				>
					{uploadStatus}
				</div>
			)}
			{imageUrl && (
				<div
					style={{
						marginTop: '1rem',
						textAlign: 'center',
					}}
				>
					<img src={imageUrl} />
				</div>
			)}
		</div>
	);
};

export default FileUploadForm;
