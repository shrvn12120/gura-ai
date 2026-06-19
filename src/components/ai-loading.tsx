export default function AiThinkingLoader() {
  return (
        <div className="w-4/5 md:w-md py-3">
      <div className="relative h-3 overflow-hidden rounded-full  shadow shadow-primary dark:shadow-none flex items-center">
         
        <div className="absolute inset-y-0 w-1/2 rounded-full bg-linear-to-r from-transparent via-primary to-transparent animate-[slide_5s_linear_infinite]" />
      <p className="w-full px-8 text-xs mx-auto my-0 text-background absolute font-bold animate-pulse">Thinking...</p> 
      </div>
    </div>
  );
}