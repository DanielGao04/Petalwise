# Dynamic Pricing & Discount Suggestions Feature

## Overview

The Dynamic Pricing & Discount Suggestions feature enhances the existing AI Recommendation tab by providing florists with actionable financial recommendations directly linked to each flower batch's predicted lifespan and AI analysis.

## Feature Components

### 1. Financial Recommendations Interface

The feature introduces a new `FinancialRecommendation` interface that includes:

```typescript
interface FinancialRecommendation {
  type: 'discount' | 'bundling' | 'flash_sale' | 'price_reduction' | 'featured_sale';
  title: string;
  description: string;
  discountPercentage?: number;
  suggestedPrice?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeWindow: string;
  justification: string;
  actionItems: string[];
}
```

### 2. AI Model Enhancement

The enhanced AI service now generates financial recommendations based on:

- **Predicted Lifespan**: Uses `ai_prediction` and `dynamic_spoilage_date`
- **Flower Characteristics**: Type, variety, initial condition
- **Storage Conditions**: Environment, care practices
- **Market Timing**: Current demand patterns and urgency

### 3. Database Schema Updates

Added new column to `flower_batches` table:
- `ai_financial_recommendations`: JSONB column storing financial recommendations

## Implementation Details

### AI Prompt Enhancement

The AI prompt now includes specific instructions for generating financial recommendations:

```json
{
  "financialRecommendations": [
    {
      "type": "discount|bundling|flash_sale|price_reduction|featured_sale",
      "title": "Brief title for the recommendation",
      "description": "Detailed description of the pricing strategy",
      "discountPercentage": number (0-100) if applicable,
      "suggestedPrice": number if applicable,
      "urgency": "low|medium|high|critical",
      "timeWindow": "e.g., 'within 12 hours', 'today only', 'next 2 days'",
      "justification": "Detailed explanation of why this pricing strategy is recommended",
      "actionItems": ["specific action 1", "specific action 2"]
    }
  ]
}
```

### UI/UX Design

The new section is displayed in the AI Recommendation tab with:

1. **Clear Sectioning**: "Pricing & Discount Suggestions" section
2. **Visual Hierarchy**: 
   - Urgency badges with color coding
   - Structured layout for pricing details
   - Action-oriented design
3. **Color Coding**:
   - Low urgency: Green (#22C55E)
   - Medium urgency: Yellow (#F59E0B)
   - High urgency: Red (#EF4444)
   - Critical urgency: Dark Red (#DC2626)

### Recommendation Types

1. **Discount**: Percentage-based price reductions
2. **Bundling**: Package deals with other items
3. **Flash Sale**: Time-limited promotional pricing
4. **Price Reduction**: Absolute price adjustments
5. **Featured Sale**: Highlighting in store displays

## Usage Examples

### Example 1: Critical Urgency (Expiring Soon)
```json
{
  "type": "flash_sale",
  "title": "Flash Sale - 40% Off",
  "description": "These roses are predicted to spoil within 12 hours. Apply immediate discount to maximize revenue.",
  "discountPercentage": 40,
  "urgency": "critical",
  "timeWindow": "within 12 hours",
  "justification": "Roses typically lose 60% of value when expired. 40% discount ensures quick sale while maintaining profit margin.",
  "actionItems": [
    "Update store signage immediately",
    "Notify staff about flash sale",
    "Feature in store window display"
  ]
}
```

### Example 2: Medium Urgency (2-3 days remaining)
```json
{
  "type": "bundling",
  "title": "Bundle with Vase",
  "description": "Create attractive package deals to increase perceived value.",
  "urgency": "medium",
  "timeWindow": "next 2 days",
  "justification": "Lilies have 2.5 days remaining. Bundling increases average order value and speeds up sales.",
  "actionItems": [
    "Create bundle pricing with complementary vases",
    "Display bundles prominently",
    "Train staff on bundle benefits"
  ]
}
```

## Technical Implementation

### Backend Changes

1. **Enhanced AI Service** (`enhancedAiService.ts`):
   - Updated prompt to include financial recommendations
   - Enhanced response parsing
   - Added fallback handling

2. **Database Migration** (`20250615000001_add_financial_recommendations.sql`):
   - Added `ai_financial_recommendations` column
   - Updated RLS policies

3. **Type Definitions** (`database.ts`):
   - Added financial recommendations to FlowerBatch interface

### Frontend Changes

1. **AI Recommendation Screen** (`ai-recommendation.tsx`):
   - Added financial recommendations section
   - Implemented urgency-based styling
   - Added comprehensive UI components

2. **Styling**:
   - New styles for financial recommendation cards
   - Urgency-based color coding
   - Responsive layout design

## Testing Strategy

### Unit Tests
- Test AI prompt generation with financial recommendations
- Validate response parsing
- Test fallback scenarios

### Integration Tests
- Test database storage and retrieval
- Verify UI rendering with different urgency levels
- Test with various flower types and conditions

### User Acceptance Tests
- Verify recommendations are actionable
- Test urgency levels match user expectations
- Validate time window suggestions

## Performance Considerations

1. **AI Response Size**: Financial recommendations increase response size by ~30%
2. **Database Storage**: JSONB column efficiently stores structured data
3. **UI Rendering**: Lazy loading for multiple recommendations
4. **Caching**: Stored recommendations reduce API calls

## Future Enhancements

1. **Machine Learning**: Train models on historical sales data
2. **Market Integration**: Real-time pricing from competitors
3. **Seasonal Adjustments**: Holiday and event-based pricing
4. **Inventory Management**: Automatic reorder suggestions
5. **Analytics Dashboard**: Track recommendation effectiveness

## Configuration

### Environment Variables
- No new environment variables required
- Uses existing OpenAI API key

### Database Configuration
- Requires Supabase with JSONB support
- RLS policies automatically applied

## Troubleshooting

### Common Issues

1. **No Financial Recommendations**: Check AI response format
2. **Styling Issues**: Verify urgency color mapping
3. **Database Errors**: Ensure migration was applied
4. **Performance**: Monitor AI response times

### Debug Information
- AI responses logged with `🔍 Enhanced AI Debug:`
- Financial recommendations stored in `ai_financial_recommendations` column
- UI state managed in React component

## Support

For technical support or feature requests, refer to:
- AI Service: `utils/enhancedAiService.ts`
- UI Component: `app/ai-recommendation.tsx`
- Database Schema: `types/database.ts`
- Migration: `supabase/migrations/20250615000001_add_financial_recommendations.sql` 