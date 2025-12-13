# Examples Directory

This directory contains practical examples demonstrating how to use the various services in the Songwriting Assistant project.

## Available Examples

### suno-formatter-example.ts

Comprehensive examples for using the `RealSunoFormatterService` (AI-powered Suno formatting).

#### Example 1: Basic Song Formatting
Shows how to format a simple song for Suno v5.0 with style preferences.

#### Example 2: AI Tag Suggestions
Demonstrates getting intelligent tag suggestions based on song content and style.

#### Example 3: Enhancement Suggestions
Shows how to get AI recommendations for improving song structure.

#### Example 4: Version Conversion
Demonstrates converting Suno-formatted text between v4.0, v4.5, and v5.0.

#### Example 5: Trimming Long Songs
Shows how to intelligently trim songs that exceed Suno's character limits.

#### Example 6: Format Validation
Demonstrates validating Suno-formatted text against platform requirements.

#### Example 7: Complete Workflow
Shows a complete workflow from song creation to final Suno-ready output.

## Running Examples

### Prerequisites

1. Set your Gemini API key:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Run All Examples

```bash
npx ts-node examples/suno-formatter-example.ts
```

### Run Individual Examples

```typescript
import { example1_BasicFormatting } from './examples/suno-formatter-example'

// Run specific example
await example1_BasicFormatting()
```

## Example Output

When you run the examples, you'll see:

```
=== Example 1: Basic Song Formatting ===

✅ Formatted successfully!

=== FORMATTED TEXT ===
[Intro]
[genre: pop]
[tempo: mid]
[mood: upbeat]

[Verse 1]
Walking down the beach at sunset
Feeling the warm sand beneath my feet
The ocean waves are calling
To a rhythm so sweet

[Chorus]
[upbeat]
Summer days, summer nights
Everything feels so right
Living in the moment
Under the moonlight

=== METADATA ===
Character count: 245/3000
Applied tags: [Intro], [genre: pop], [tempo: mid], [Verse 1], [Chorus], [upbeat]
Valid: true
```

## Notes

- All examples use the **real** AI-powered service (not mocks)
- Requires valid Gemini API key
- Requires internet connection
- Small API costs apply (~$0.001-0.002 per example)
- Examples demonstrate best practices for error handling
- All examples follow the ServiceResponse pattern

## Troubleshooting

### "API key is required" Error
Make sure you've set the `GEMINI_API_KEY` environment variable:
```bash
export GEMINI_API_KEY="your-key-here"
```

### Network Errors
Ensure you have internet connection and the Gemini API is accessible.

### Rate Limit Errors
If you see rate limit errors, wait a moment and try again. The free tier has limits on requests per minute.

## More Information

- **API Documentation**: See `/docs/REAL_SUNO_FORMATTER_IMPLEMENTATION.md`
- **Implementation Report**: See `/IMPLEMENTATION_REPORT_SUNO_FORMATTER.md`
- **Contract Definition**: See `/src/contracts/SunoFormatter.ts`
- **Service Implementation**: See `/src/services/real/RealSunoFormatterService.ts`

## Adding New Examples

To add a new example:

1. Create a new async function in `suno-formatter-example.ts`
2. Follow the existing pattern:
   ```typescript
   async function exampleN_YourExample() {
     console.log('=== Example N: Your Example ===\n')
     // Your code here
   }
   ```
3. Add to `runAllExamples()` function
4. Export the function for standalone use
5. Update this README

## Contributing

Examples should:
- Be self-contained and runnable
- Include clear console output
- Handle errors gracefully
- Follow TypeScript best practices
- Include comments explaining key concepts
