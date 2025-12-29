# Message Actions Configuration

This file contains the configuration for detecting actions, poses, emotions, clothing, and environments from chat messages to generate more accurate images.

## How to Add New Actions

### 1. Open `message-actions.ts`
Located in: `config/message-actions.ts`

### 2. Add to the appropriate category

#### For Emotions:
```typescript
{
  keywords: ['excited', 'thrilled', 'ecstatic'],
  tags: ['excited', 'thrilled', 'ecstatic', 'happy expression'],
  priority: 1
}
```

#### For Poses:
```typescript
{
  keywords: ['handstand', 'cartwheel'],
  tags: ['handstand', 'acrobatic pose', 'flexible'],
  priority: 2  // Higher priority = checked first
}
```

#### For Clothing:
```typescript
{
  keywords: ['kimono', 'yukata'],
  tags: ['wearing kimono', 'traditional japanese clothing'],
  priority: 1
}
```

#### For Environments:
```typescript
{
  keywords: ['hot spring', 'onsen'],
  tags: ['hot spring setting', 'steam', 'natural hot water'],
  priority: 1
}
```

## Priority System

- **Priority 1**: Standard actions (checked first)
- **Priority 2+**: Specific or complex actions (checked earlier than priority 1)
- Higher numbers = higher priority

## Best Practices

1. **Multiple Keywords**: Add several related keywords for better detection
2. **Descriptive Tags**: Use clear, descriptive tags that work well with image generation
3. **Test**: Test new patterns with actual chat messages
4. **No Duplicates**: Check existing patterns before adding new ones

## Example Usage

When a user types:
> "She excitedly does a handstand in the hot spring wearing a kimono"

The system will extract:
- **Emotions**: `excited, thrilled, ecstatic, happy expression`
- **Poses**: `handstand, acrobatic pose, flexible`
- **Clothing**: `wearing kimono, traditional japanese clothing`
- **Environments**: `hot spring setting, steam, natural hot water`

These elements are then combined into the image generation prompt for more accurate results.

## Current Categories

- **Emotions**: Feelings and emotional states
- **Poses**: Physical positions and actions
- **Clothing**: What the character is wearing
- **Environments**: Where the character is located

Feel free to extend any category with new patterns as needed!
