import { CareerGraph } from './components/CareerGraph';

function App() {
  return (
    // w-full y h-screen son obligatorios para que React Flow se vea
    <div className="w-full h-screen bg-gray-50"> 
      <CareerGraph />
    </div>
  );
}

export default App;