# Feature: Delayed/Unprompted Messages from Buddies

The idea is that Buddies could send the user a message without necessarily needing them to send one first. There is at least a couple angles as far as the app's "canon" if you will:

- Buddy is busy: The user sends a message but the Buddy wouldn't be available contextually.
  - I'm not sure exactly what I mean here, probably get the decision whether to respond from the LLM anyway.
- Buddy reaches out: The Buddy was the last to speak and the user leaves their chat (unfocused is tricky, so likely still in-app at first) and the Buddy sends them a new message.
  - The only way I can think to accomplish this would be to schedule a potential new message along with messages (maybe instruct to generate max 1 sentence), which would be thrown away when a new message comes in from the user.
  - Perhaps we could have an option to use ntfy.sh or similar to schedule a push notification? Would be tricky because you can't cancel the notification.
    - <https://docs.ntfy.sh/publish/#scheduled-delivery>

This feature would most likely be after we start using [proper JSON mode](./json-mode.md)
