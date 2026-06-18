export {}
declare global {

  namespace NodeJS {
    interface ProcessEnv {
     NEXT_PUBLIC_APP_URL: string;
     MONGODB_URI: string
     JWT_SECRET: string
     OPENAI_API_KEY: string
    }
  }

}