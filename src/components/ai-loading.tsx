export default function AiThinkingLoader() {
  return (
    <div className="w-full md:w-md py-3">
      <div className="relative h-10 overflow-hidden rounded-full   flex items-center">

        <div className="absolute h-px inset-y-0 w-1/2 shadow-[0px_38px_30px_-10px_primary]  rounded-full bg-linear-to-r from-transparent via-primary to-transparent animate-[slide_3s_linear_infinite]" />
        <div className="absolute h-px bottom-0 w-1/2 shadow-[0px_38px_30px_-10px_primary]  rounded-full bg-linear-to-r from-transparent via-primary to-transparent animate-[slide_3s_linear_infinite] delay-500" />
        <p className="w-full px-8 text-xs mx-auto my-0 text-primary absolute font-light animate-pulse">Thinking...</p>
      </div>
    </div>
  );
}

// 