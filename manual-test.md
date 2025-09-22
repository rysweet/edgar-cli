# Manual Interactive Mode Test

## Steps to test within-session memory:

1. Start Edgar in interactive mode:
```bash
node dist/index.js
```

2. Send these messages in sequence:
   - "My name is Bob and I like Python"
   - "What's my name?"
   - "What language did I mention?"
   - "I also like TypeScript"
   - "What two languages have I mentioned so far?"

## Expected Results:
- Message 2: Should respond with "Bob"
- Message 3: Should respond with "Python"
- Message 5: Should respond with both "Python" and "TypeScript"

## Actual Results:
To be filled in after manual testing...