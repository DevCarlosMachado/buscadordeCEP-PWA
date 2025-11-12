import { useEffect, useState } from "react";
import "./index.css";

// Define o tipo dos dados retornados pela API ViaCEP
interface Endereco {
  cep: string;
  logradouro?: string;
  bairro?: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

function App() {
  const [cep, setCep] = useState<string>("");
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string>("");
  const [permissao, setPermissao] = useState<string>("verificando");

  // Verifica automaticamente o status da permissão ao abrir o app
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          setPermissao(result.state);
          result.onchange = () => setPermissao(result.state);
        })
        .catch(() => {
          // Alguns navegadores (como Safari no iPhone) não suportam essa API
          setPermissao("desconhecido");
        });
    } else {
      setPermissao("desconhecido");
    }
  }, []);

  // Função principal: obtém a localização e busca o CEP
  const obterEndereco = async () => {
    setLoading(true);
    setErro("");
    setEndereco(null);

    if (!navigator.geolocation) {
      setErro("Seu navegador não suporta geolocalização 😢");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1️⃣ Buscar o CEP aproximado com Nominatim (OpenStreetMap)
          const respNominatim = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const dataNom = await respNominatim.json();

          const cepAprox = dataNom.address?.postcode;
          if (!cepAprox) {
            setErro("Não foi possível encontrar um CEP nessa região.");
            setLoading(false);
            return;
          }

          setCep(cepAprox);

          // 2️⃣ Buscar os dados completos do CEP na API ViaCEP
          const respViaCEP = await fetch(
            `https://viacep.com.br/ws/${cepAprox}/json/`
          );
          const dataVia: Endereco = await respViaCEP.json();

          if (dataVia.erro) {
            setErro("CEP não encontrado na base do ViaCEP.");
          } else {
            setEndereco(dataVia);
          }
        } catch {
          setErro("Ocorreu um erro ao buscar os dados.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErro("Permita o acesso à localização para usar o app.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="app-container">
      <h1 className="titulo">📍 Meu CEP</h1>
      <p className="descricao">
        Descubra seu endereço aproximado usando a localização do seu dispositivo.
      </p>

      {/* Mostra status da permissão */}
      <p className="status">
        <strong>Permissão de localização:</strong>{" "}
        {permissao === "granted"
          ? "Permitida ✅"
          : permissao === "denied"
          ? "Negada 🚫"
          : permissao === "prompt"
          ? "Aguardando autorização ⚙️"
          : "Desconhecida"}
      </p>

      {/* Botão principal */}
      <button className="botao" onClick={obterEndereco} disabled={loading}>
        {loading ? "Buscando..." : "Obter meu endereço"}
      </button>

      {/* Caso o usuário tenha negado */}
      {permissao === "denied" && (
        <p className="erro">
          Acesso à localização negado. Vá em <strong>Ajustes → Safari → Localização → Permitir</strong> e
          recarregue a página.
        </p>
      )}

      {/* Mensagem de erro */}
      {erro && <p className="erro">{erro}</p>}

      {/* Exibição do endereço */}
      {endereco && (
        <div className="card">
          <h2>Endereço encontrado:</h2>
          <p>
            <strong>CEP:</strong> {endereco.cep}
          </p>
          <p>
            <strong>Rua:</strong> {endereco.logradouro || "Não disponível"}
          </p>
          <p>
            <strong>Bairro:</strong> {endereco.bairro || "Não disponível"}
          </p>
          <p>
            <strong>Cidade:</strong> {endereco.localidade} - {endereco.uf}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
