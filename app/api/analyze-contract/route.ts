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
    // Call OpenAI API with the updated prompt for categorized risks
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert legal analyst specializing in contract risk assessment.
          
          Analyze the provided contract and categorize all identified risks into two distinct groups:
          
          1. MAJOR RISKS: Critical issues that could have significant legal, financial, or operational implications. These are high-priority concerns that require immediate attention or renegotiation.
          
          2. MINOR RISKS: Less critical issues that present potential problems, ambiguities, or inefficiencies that should be addressed but are not deal-breakers.
          
          Format your response EXACTLY as follows:
          
          MAJOR RISKS:
          - [Risk Title 1]: Brief explanation
          - [Risk Title 2]: Brief explanation
          
          MINOR RISKS:
          - [Risk Title 1]: Brief explanation
          - [Risk Title 2]: Brief explanation
          
          Do not include general summaries or introductions - focus exclusively on identifying and categorizing specific risks with clear headings. If there are no risks in a category, still include the heading but note "None identified."`
        },
        {
          role: "user",
          content: `Analyze this contract and categorize all risks as either major or minor:\n\n${contractText}`
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