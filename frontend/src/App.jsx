import { useState } from 'react'
import './App.css'

function App() {
  const [peso, setPeso] = useState("-");
  const [status, setStatus] = useState("-");
  const [imgUrls, setImgUrls] = useState({});
  const [portaAberta, setPortaAberta] = useState(false);
  const [formData, setFormData] = useState({
    operador: "", motorista: "", cpfMotorista: "", transportadora: "",
    nfeNumero: "", nfeChave: "", produtoCodigo: "", produtoDescricao: ""
  });

  async function abrirPorta() {
    setPortaAberta(true); setStatus("Conectado")
  }

  async function fecharPorta() {
    setPortaAberta(false); setStatus("Desconectado"); setPeso("-"); setImgUrls({})
  }

  async function capturarPeso() {
    const pesoSimulado = (Math.random() * 100).toFixed(2) + " kg";
    setPeso(pesoSimulado); setStatus("Conectado")
  }

  async function capturarImagem() {
    const canais = [1, 2, 3, 4]; const urls = {};
    canais.forEach(canal => { urls[`canal${canal}`] = `http://localhost:4000/camera/${canal}`; });
    setImgUrls(urls);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center">SmartAgro - Balança Rodoviária</h1>
      <div className="space-y-2">
        {["operador", "motorista", "cpfMotorista", "transportadora", "nfeNumero", "nfeChave", "produtoCodigo", "produtoDescricao"].map(field => (
          <input key={field} name={field} value={formData[field]} onChange={handleChange} placeholder={field} className="w-full p-2 border rounded" />
        ))}
      </div>
      <div className="text-xl text-blue-600">Peso: {peso}</div>
      <div className={`font-semibold ${status === "Conectado" ? "text-green-600" : "text-red-500"}`}>Status: {status}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={abrirPorta} disabled={portaAberta}>Abrir Porta</button>
        <button onClick={fecharPorta} disabled={!portaAberta}>Fechar Porta</button>
        <button onClick={capturarPeso} disabled={!portaAberta}>Capturar Peso</button>
        <button onClick={capturarImagem}>Capturar Imagem</button>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Imagens das Câmeras:</h3>
        {Object.keys(imgUrls).length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(imgUrls).map(([canal, url]) => (
              <div key={canal}>
                <h4 className="text-md font-medium">{canal}</h4>
                <img src={url} alt={`Imagem do ${canal}`} className="mt-2 w-full border rounded" />
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500">Nenhuma imagem capturada</p>}
      </div>
    </div>
  )
}

export default App
