import React from 'react';
import Thread from './components/assistant/Thread';

const App: React.FC = () => {
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-white antialiased text-zinc-950 font-sans overflow-hidden">
      <Thread />
    </div>
  );
};

export default App;