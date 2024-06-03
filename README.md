![Coverage](https://raw.githubusercontent.com/wiki/snlacks/otp-auth-server/coverage.svg)

# One Time Password Server and AI Chat Gateway

PLEASE don't just pull this and try to run this for your production server. Please. Please, not for licensing, you're welcome to take this code. It's just not vetted enough. This is a one time password backend and AI chat gateway to an Ollama Server. It requries a login via SMS to access the chat, has basic plubming for roles (User and Admin are included, but it should be easy to add more) and generating tokens in dev environment. 

To get this running:

```bash
DB_USERNAME=*
DB_PASSWORD=*
DB_DATABASE=*
TWILIO_ACCOUNT_SID=*
TWILIO_AUTH_TOKEN=*
ONE_TIME_PASSWORD_SMS_SENDER_NUMBER=*
JWT_SECRET=*
JWT_EXPIRES=*
OLLAMA_URI=*
```

POST  /auth/request-otp
POST  /auth/login
POST  /auth/refresh
GET   /users (protected, role Admin)
POST  /users
POST  /ai-chat/chat-strram/

It uses external dependencies (each has a module): Ollama webservice, Twillio, and MySql. Because they're in OO/Nest Modules they should be really easy to replace with other external services.

## License

This is [MIT licensed](LICENSE).
