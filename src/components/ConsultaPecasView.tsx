import React, { useState } from 'react';
import { 
  Home, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  Copy, 
  ExternalLink, 
  Layers, 
  Star, 
  ShieldCheck, 
  Truck, 
  Info, 
  Car,
  Settings,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import brakeRotorImg from '../assets/images/brake_rotor_part_1789396161455.jpg';
import { Product } from '../types';

interface ConsultaPecasViewProps {
  onAddToCart?: (part: any, qty: number) => void;
  onAddToQuote?: (part: any) => void;
  onNavigateToView?: (view: string) => void;
  onShowNotification?: (title: string, message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ConsultaPecasView: React.FC<ConsultaPecasViewProps> = ({
  onAddToCart,
  onAddToQuote,
  onNavigateToView,
  onShowNotification,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'aplicacoes' | 'descricao' | 'equivalentes' | 'avaliacoes'>('aplicacoes');
  const [copiedOem, setCopiedOem] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Active product data matching the screenshot 1:1
  const [currentPart, setCurrentPart] = useState({
    name: 'Disco de Freio Dianteiro',
    brand: 'BOSCH',
    brandCode: '0986479265',
    oemCode: '13502073',
    price: 289.90,
    stock: 5,
    application: 'Chevrolet Onix 1.0 / 1.4 2013 - 2024',
    system: 'Freio',
    position: 'Dianteiro',
    specs: {
      oem: '13502073',
      fabricante: '0986479265',
      marca: 'BOSCH',
      diametro: '280 mm',
      espessura: '24 mm',
      furoCentral: '60 mm',
      ncm: '8708.30.90',
    },
    applications: [
      { veiculo: 'Chevrolet Onix 1.0', ano: '2013 - 2016', motor: '1.0 8V Flex', versao: 'LT / LS / Joy' },
      { veiculo: 'Chevrolet Onix 1.4', ano: '2013 - 2020', motor: '1.4 8V Flex', versao: 'LT / LTZ' },
      { veiculo: 'Chevrolet Prisma 1.0', ano: '2013 - 2019', motor: '1.0 8V Flex', versao: 'LT / Joy' },
      { veiculo: 'Chevrolet Prisma 1.4', ano: '2013 - 2019', motor: '1.4 8V Flex', versao: 'LT / LTZ' },
    ],
  });

  const equivalentParts = [
    {
      brand: 'TRW',
      code: 'DF4205',
      subCode: 'DF-DF4205',
      price: 285.90,
      stock: 3,
    },
    {
      brand: 'Fras-le',
      code: 'PD/3123',
      subCode: 'PD-3123',
      price: 248.90,
      stock: 8,
    },
    {
      brand: 'Marelli',
      code: 'MDFB-1234',
      subCode: 'MDFB-1234',
      price: 279.90,
      stock: 4,
    },
  ];

  const handleCopyOem = () => {
    navigator.clipboard.writeText(currentPart.specs.oem);
    setCopiedOem(true);
    setTimeout(() => setCopiedOem(false), 2000);
    onShowNotification?.('Código OEM copiado', `Código ${currentPart.specs.oem} copiado para a área de transferência.`);
  };

  const handleAddToCart = () => {
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    onAddToCart?.(currentPart, quantity);
    onShowNotification?.('Adicionado ao Carrinho', `${quantity}x ${currentPart.name} (${currentPart.brand}) adicionado com sucesso!`, 'success');
  };

  const handleAddToQuote = () => {
    onAddToQuote?.(currentPart);
    onShowNotification?.('Adicionado à Cotação', `${currentPart.name} enviado para a Cotação de Balcão.`, 'info');
    onNavigateToView?.('cotacao');
  };

  const handleSelectEquivalent = (eq: typeof equivalentParts[0]) => {
    setCurrentPart(prev => ({
      ...prev,
      brand: eq.brand,
      brandCode: eq.code,
      price: eq.price,
      stock: eq.stock,
      specs: {
        ...prev.specs,
        marca: eq.brand,
        fabricante: eq.code,
      }
    }));
    onShowNotification?.('Peça Selecionada', `Alternado para ${eq.brand} (${eq.code})`, 'info');
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200" id="consulta-pecas-view">
      {/* Breadcrumb matching screenshot */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <button 
          onClick={() => onNavigateToView?.('dashboard')}
          className="flex items-center gap-1.5 hover:text-slate-900 transition cursor-pointer"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Início</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="hover:text-slate-900 cursor-pointer" onClick={() => onNavigateToView?.('consulta-pecas')}>
          Consulta de Peças
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">
          {currentPart.name.includes('Disco') ? 'Disco de Freio' : currentPart.name}
        </span>
      </nav>

      {/* Main Top Section: 3-Column Layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Col 1: Product Gallery Card (Left - 4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          {/* Stock badge top-left */}
          <div className="flex items-center justify-between">
            <span className="bg-[#EA580C] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
              Em estoque
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Foto Real
            </span>
          </div>

          {/* Main Product Image */}
          <div className="py-6 flex items-center justify-center relative min-h-[260px]">
            <img 
              src={brakeRotorImg} 
              alt={currentPart.name} 
              className={`max-h-64 object-contain transition-all duration-300 ${
                selectedThumbnail === 0 
                  ? 'scale-100' 
                  : selectedThumbnail === 1 
                    ? 'rotate-45 scale-95' 
                    : selectedThumbnail === 2 
                      ? '-rotate-30 scale-95' 
                      : 'brightness-110 scale-100'
              }`}
            />
          </div>

          {/* Thumbnail Strip (4 squares matching screenshot) */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedThumbnail(idx)}
                className={`h-16 rounded-xl border flex items-center justify-center overflow-hidden bg-slate-50/60 p-1.5 transition cursor-pointer ${
                  selectedThumbnail === idx 
                    ? 'border-[#EA580C] ring-2 ring-[#EA580C]/20 bg-white shadow-2xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img 
                  src={brakeRotorImg} 
                  alt={`Ângulo ${idx + 1}`} 
                  className={`max-h-full object-contain ${
                    idx === 1 ? 'rotate-45 scale-90' : idx === 2 ? '-rotate-30 scale-90' : ''
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Col 2: Product Header, Features, Price, CTAs (Center - 5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-full">
          <div>
            {/* Manufacturer Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black">
                B
              </div>
              <span className="text-red-600 font-extrabold tracking-tight text-base font-['Outfit']">
                {currentPart.brand}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 leading-tight">
              {currentPart.name}
            </h1>

            {/* Subtitle / Manufacturer Code */}
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              {currentPart.brand} - {currentPart.brandCode}
            </p>

            {/* Quick bullet points with circular icons */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                <span>
                  <strong className="text-slate-900 font-semibold">Aplicação:</strong> {currentPart.application}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                <span>
                  <strong className="text-slate-900 font-semibold">Sistema:</strong> {currentPart.system}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                <span>
                  <strong className="text-slate-900 font-semibold">Posição:</strong> {currentPart.position}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing and Purchase Block matching screenshot */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            {/* Price line + Stock count */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#EA580C] tracking-tight">
                  R$ {currentPart.price.toFixed(2).replace('.', ',')}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  à vista
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-bold">Em estoque</span>
                <span className="text-slate-900 font-bold ml-1">{currentPart.stock} un.</span>
              </div>
            </div>

            {/* Stepper + Primary Cart CTA */}
            <div className="flex items-center gap-3 mt-4">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-3 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-slate-900 text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-3 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Orange Button */}
              <button
                type="button"
                id="btn-add-to-cart-view"
                onClick={handleAddToCart}
                className={`flex-1 bg-[#EA580C] hover:bg-[#D94606] text-white font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 text-sm sm:text-base ${
                  addedAnimation ? 'ring-4 ring-orange-300 scale-98' : ''
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Adicionar ao carrinho</span>
              </button>
            </div>

            {/* Secondary Quote Button */}
            <button
              type="button"
              id="btn-add-to-quote-view"
              onClick={handleAddToQuote}
              className="w-full mt-3 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Adicionar à cotação</span>
            </button>
          </div>
        </div>

        {/* Col 3: Side Panels (Right - 3 cols on lg) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Technical Information Card matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 tracking-tight">
              Informações técnicas
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Código Original (OEM)</span>
                <button 
                  onClick={handleCopyOem}
                  className="flex items-center gap-1 font-semibold text-slate-800 hover:text-[#EA580C] transition cursor-pointer"
                  title="Copiar Código OEM"
                >
                  <span>{currentPart.specs.oem}</span>
                  {copiedOem ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Código Fabricante</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.fabricante}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Marca</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.marca}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Diâmetro Externo</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.diametro}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Espessura</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.espessura}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Furo Central</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.furoCentral}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">NCM</span>
                <span className="font-semibold text-slate-800">{currentPart.specs.ncm}</span>
              </div>
            </div>
          </div>

          {/* Equivalent Parts Card matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 tracking-tight">
              Peças equivalentes
            </h3>

            <div className="space-y-3">
              {equivalentParts.map((eq, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group"
                  onClick={() => handleSelectEquivalent(eq)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <img src={brakeRotorImg} alt={eq.brand} className="max-h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#EA580C] transition">
                        {eq.brand}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {eq.code}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {eq.subCode}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      R$ {eq.price.toFixed(2).replace('.', ',')}
                    </p>
                    <span className="text-[10px] text-slate-400 group-hover:text-[#EA580C] font-medium transition flex items-center gap-0.5 justify-end">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Tabs & Applications Table matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-200 px-6 gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('aplicacoes')}
            className={`py-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'aplicacoes'
                ? 'border-[#EA580C] text-[#EA580C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
            <span>Aplicações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('descricao')}
            className={`py-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'descricao'
                ? 'border-[#EA580C] text-[#EA580C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Descrição
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equivalentes')}
            className={`py-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'equivalentes'
                ? 'border-[#EA580C] text-[#EA580C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Equivalentes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avaliacoes')}
            className={`py-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'avaliacoes'
                ? 'border-[#EA580C] text-[#EA580C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Avaliações
          </button>
        </div>

        {/* Tab 1: Aplicações Table matching screenshot */}
        {activeTab === 'aplicacoes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-6">Veículo</th>
                  <th className="py-3 px-6">Ano</th>
                  <th className="py-3 px-6">Motor</th>
                  <th className="py-3 px-6">Versão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentPart.applications.map((app, index) => (
                  <tr key={index} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-6 font-medium text-slate-900">
                      {app.veiculo}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {app.ano}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {app.motor}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {app.versao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Descrição */}
        {activeTab === 'descricao' && (
          <div className="p-6 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              O <strong>Disco de Freio Dianteiro BOSCH (0986479265)</strong> é fabricado com liga especial de ferro fundido cinzento de alto teor de carbono (G3000), garantindo excelente dissipação térmica, resistência ao empenamento e coeficiente de atrito estável mesmo em frenagens bruscas contínuas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 text-xs">Ventilação Interna</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Aletas radiais de resfriamento aerodinâmico.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 text-xs">Pintura Anti-corrosão</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Revestimento protetor para cubos e bordas.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 text-xs">Balanceamento OE</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Zero trepidação no pedal e volante.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Equivalentes Full Matrix */}
        {activeTab === 'equivalentes' && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {equivalentParts.map((eq, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Intercambiável</span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{eq.brand}</h4>
                    <p className="text-xs text-slate-700 font-mono mt-0.5">{eq.code} ({eq.subCode})</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-black text-[#EA580C] text-sm">R$ {eq.price.toFixed(2).replace('.', ',')}</span>
                    <button
                      onClick={() => handleSelectEquivalent(eq)}
                      className="text-xs font-bold text-slate-700 hover:text-[#EA580C] transition"
                    >
                      Selecionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Avaliações */}
        {activeTab === 'avaliacoes' && (
          <div className="p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-900">4.9 de 5 estrelas</span>
              <span className="text-slate-400">• 42 avaliações de oficinas e balcões</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Auto Mecânica São José</span>
                <span className="text-slate-400 text-[11px]">Há 2 dias</span>
              </div>
              <p className="text-slate-600 mt-1">Disco com acabamento impecável, encaixe perfeito no cubo do Onix 2018 sem ruído de pastilha.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
