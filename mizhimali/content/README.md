# Sample Content Folder Structure

This folder contains question bank data and assets for the presentation system.

## Required Files

- **bank.json** (mandatory): Contains all question data
- **logo.svg/png/jpg/webp** (optional): Company or event logo

## Folder Structure

```
content/
├── bank.json           (question bank)
├── logo.png            (optional logo)
└── assets/
    ├── images/         (question images)
    └── audio/          (question audio files)
```

## bank.json Format

```json
{
  "schema_version": 1,
  "rounds": [
    {
      "round": 1,
      "key": "unique_key",
      "name": "Round name",
      "items": [
        {
          "id": "unique-question-id",
          "prompt": "Question text or emoji",
          "answer": "Answer text (optional)",
          "asset": "assets/images/pic.png (optional)",
          "meta": {}
        }
      ]
    }
  ]
}
```

## Question Types Supported

1. **Emoji questions**: Use emoji in prompt field
2. **Image questions**: Provide asset path to image
3. **Audio questions**: Provide asset path to audio file (.mp3, .wav, etc.)
4. **Open riddles**: Text-only questions with optional answers

## Notes

- All asset paths are relative to the content folder root
- Missing assets will show placeholders (won't crash)
- Invalid questions are skipped with console warnings
- Each question generates one slide in the presentation
