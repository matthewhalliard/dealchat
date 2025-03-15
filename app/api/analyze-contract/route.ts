import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json();
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Get the contract's extracted text from the database
    const contracts = await sql`
      SELECT id, filename, extracted_text
      FROM contracts
      WHERE id = ${contractId}
    `;

    if (contracts.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contract = contracts[0];
    const contractText = contract.extracted_text;
    
    if (!contractText) {
      return NextResponse.json(
        { error: 'No extracted text available for this contract' },
        { status: 400 }
      );
    }

    // Analyze the contract using OpenAI
    const analysisResult = await analyzeContractWithOpenAI(contractText);
    
    // Save analysis result to database
    await sql`
      INSERT INTO contract_analyses (contract_id, analysis_type, analysis_result)
      VALUES (${contractId}, 'risk_analysis', ${analysisResult})
    `;

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Error in contract analysis:', error);
    return NextResponse.json(
      { error: 'Error analyzing contract', details: String(error) },
      { status: 500 }
    );
  }
}

async function analyzeContractWithOpenAI(contractText: string): Promise<string> {
  try {
    // Call OpenAI API with updated prompt for party-based risk analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert legal analyst specializing in contract risk assessment.
          
          Analyze the provided contract and:
          
          1. Identify all parties to the contract (e.g., companies, entities, individuals)
          2. For each party, determine the specific risks they are taking on
          3. Assign each party an overall risk score from 1-100, where:
             - 1-20: Very low risk
             - 21-40: Low risk
             - 41-60: Moderate risk
             - 61-80: High risk
             - 81-100: Very high risk
          
          Format your response EXACTLY as follows:
          
          PARTIES:
          - Party Name 1: Risk Score 50/100
          - Party Name 2: Risk Score 75/100
          
          RISKS FOR Party Name 1:
          - Risk Title 1: Brief explanation
          - Risk Title 2: Brief explanation
          
          RISKS FOR Party Name 2:
          - Risk Title 1: Brief explanation
          - Risk Title 2: Brief explanation
          
          Do not include general summaries or introductions. Focus exclusively on identifying parties and their specific risks with clear headings. 
          
          If you cannot identify any parties, still include "PARTIES:" followed by "- Unknown Party: Risk Score 50/100" and then provide an analysis section for that unknown party.
          
          Be concise but comprehensive. Analyze obligations, liabilities, penalties, and potential legal exposures.`
        },
        {
          role: "user",
          content: `Analyze this contract to identify all parties, list specific risks for each party, and provide an overall risk score (1-100) for each party:\n\n${contractText}`
        }
      ],
      temperature: 0.2, // Lower temperature for more focused, analytical response
      max_tokens: 2000,
    });

    // Extract the response
    const analysisText = response.choices[0].message.content;
    return analysisText || "No analysis could be generated.";
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
} 