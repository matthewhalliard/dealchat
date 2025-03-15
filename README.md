# DealChat

DealChat is a web application that helps users analyze contracts by extracting text from PDF documents and providing AI-powered risk analysis.

## Features

- Upload PDF contracts
- Extract and store text from PDFs
- Analyze contracts for risks using OpenAI's API
- View and manage your contracts in a single interface

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env.local` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url_here
```

4. Run the development server:
```bash
npm run dev
```

### How to Use

1. **Upload a Contract**: 
   - Click "Browse Files" to select a PDF contract
   - Click "Upload PDF" to upload it to the system

2. **View Your Contracts**:
   - All uploaded contracts are displayed in the "Available Contracts" section
   - Click on any contract to view its details in the Analysis section

3. **Analyze a Contract**:
   - Click "Analyze contract with AI" to extract text and analyze the contract
   - The system will:
     - Extract text from the PDF
     - Save the text to the database
     - Send the text to OpenAI for risk analysis
     - Display the analysis results above the extracted text

4. **View Analysis Results**:
   - The AI Risk Analysis section shows potential risks, key terms, and areas needing clarification
   - The Extracted Text section shows the raw text extracted from the PDF

## Technology Stack

- Next.js (React framework)
- TypeScript
- Tailwind CSS
- OpenAI API for contract analysis
- Vercel Blob Storage for file storage
- PostgreSQL (via Neon) for database

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
