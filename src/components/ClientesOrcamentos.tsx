import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Percent, 
  Building2, 
  Car, 
  Truck, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  Share2, 
  Edit3, 
  AlertCircle,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { Customer, CustomerType, CustomerDiscountPolicy, Quote, QuoteStatus, Product } from '../types';
import { DEFAULT_DISCOUNT_POLICIES } from '../data/initialData';

interface ClientesOrcamentosProps {
  customers: Customer[];
  quotes: Quote[];
  products: Product[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateQuotes: (quotes: Quote[]) => void;
  onConvertQuoteToSale: (quote: Quote) => void;
  onNavigateToQuoteWithCustomer?: (customer: Customer) => void;
  onShowNotification: (title: string, message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ClientesOrcamentos: React.FC<ClientesOrcamentosProps> = ({
  customers,
  quotes,
  products,
  onUpdateCustomers,
  onUpdateQuotes,
  onConvertQuoteToSale,
  onNavigateToQuoteWithCustomer,
  onShowNotification,
}) => {
  // Tabs: 'orcamentos' | 'clientes' | 'politicas'
  const [activeTab, setActiveTab] = useState<'orcamentos' | 'clientes' | 'politicas'>('orcamentos');

  // Search and filters
  const [searchQuoteTerm, setSearchQuoteTerm] = useState('');
  const [selectedQuoteStatus, setSelectedQuoteStatus] = useState<string>('all');
  const [searchCustomerTerm, setSearchCustomerTerm] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('all');

  // Selected customer for detail drawer or modal
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  // Selected quote for detail modal
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  // Discount policies state (configurable)
  const [policies, setPolicies] = useState<CustomerDiscountPolicy[]>(DEFAULT_DISCOUNT_POLICIES);
  const [editingPolicy, setEditingPolicy] = useState<CustomerDiscountPolicy | null>(null);

  // Modal new customer
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    type: 'consumidor' as CustomerType,
    document: '',
    phone: '',
    email: '',
    city: 'São Paulo',
    uf: 'SP',
    discountRate: 0,
    address: '',
    creditLimit: 2000,
  });

  // Filtered quotes
  const filteredQuotes = quotes.filter(q => {
    const term = searchQuoteTerm.toLowerCase();
    const matchesSearch = 
      q.quoteNumber.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      q.customerDocument.includes(term) ||
      q.items.some(it => it.productName.toLowerCase().includes(term) || it.productCode.toLowerCase().includes(term));
    const matchesStatus = selectedQuoteStatus === 'all' || q.status === selectedQuoteStatus;
    return matchesSearch && matchesStatus;
  });

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const term = searchCustomerTerm.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) ||
      c.document.includes(term) ||
      c.phone.includes(term) ||
      c.city.toLowerCase().includes(term);
    const matchesType = selectedCustomerType === 'all' || c.type === selectedCustomerType;
    return matchesSearch && matchesType;
  });

  // Format currency
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper type badge
  const renderCustomerTypeBadge = (type: CustomerType) => {
    switch (type) {
      case 'frotista':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            <Truck className="w-3 h-3" />
            Frotista & Transportadora
          </span>
        );
      case 'mecanica':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            <Building2 className="w-3 h-3" />
            Oficina Mecânica
          </span>
        );
      case 'cliente_fiel':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            Cliente Fiel
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            <Car className="w-3 h-3" />
            Consumidor Final
          </span>
        );
    }
  };

  // Status badge for quote
  const renderQuoteStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'Convertido':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full font-black text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Convertido em Venda (NF-e)
          </span>
        );
      case 'Aprovado':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-[#0284C7] border border-sky-300 px-2.5 py-0.5 rounded-full font-black text-[11px]">
            <Check className="w-3 h-3 text-[#0284C7]" />
            Aprovado pelo Cliente
          </span>
        );
      case 'Recusado':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
            <XCircle className="w-3 h-3 text-rose-500" />
            Recusado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendente no Balcão
          </span>
        );
    }
  };

  // Convert quote to sale handler
  const handleConvertQuote = (quote: Quote) => {
    if (quote.status === 'Convertido') {
      onShowNotification('Aviso', 'Este orçamento já foi convertido em venda e faturado.', 'info');
      return;
    }
    onConvertQuoteToSale(quote);
  };

  // Update quote status
  const handleSetQuoteStatus = (quoteId: string, newStatus: QuoteStatus) => {
    const updated = quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q);
    onUpdateQuotes(updated);
    onShowNotification(
      'Status do Orçamento Atualizado',
      `Orçamento marcado como ${newStatus}.`,
      'info'
    );
  };

  // Save new customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.document.trim()) {
      onShowNotification('Campos Obrigatórios', 'Preencha o Nome e CPF/CNPJ do cliente.', 'warning');
      return;
    }

    const policy = policies.find(p => p.type === newCustomerForm.type);
    const discountRate = newCustomerForm.discountRate || policy?.defaultDiscountPercent || 0;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerForm.name.trim(),
      type: newCustomerForm.type,
      document: newCustomerForm.document.trim(),
      phone: newCustomerForm.phone.trim(),
      email: newCustomerForm.email.trim(),
      city: newCustomerForm.city.trim(),
      uf: newCustomerForm.uf.trim().toUpperCase(),
      discountRate,
      address: newCustomerForm.address.trim(),
      creditLimit: Number(newCustomerForm.creditLimit) || 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateCustomers([newCust, ...customers]);
    setShowNewCustomerModal(false);
    setNewCustomerForm({
      name: '',
      type: 'consumidor',
      document: '',
      phone: '',
      email: '',
      city: 'São Paulo',
      uf: 'SP',
      discountRate: 0,
      address: '',
      creditLimit: 2000,
    });

    onShowNotification(
      'Cliente Cadastrado com Sucesso!',
      `${newCust.name} adicionado com política de desconto de ${newCust.discountRate}%.`,
      'success'
    );
  };

  // Update policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    setPolicies(policies.map(p => p.type === editingPolicy.type ? editingPolicy : p));
    setEditingPolicy(null);
    onShowNotification(
      'Política de Desconto Atualizada!',
      `Nível ${editingPolicy.label} agora possui ${editingPolicy.defaultDiscountPercent}% de desconto padrão.`,
      'success'
    );
  };

  return (
    <div className="space-y-6" id="view-clientes-orcamentos">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-sky-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-[#0284C7]" />
            <span>Gestão Comercial: Orçamentos, Clientes & Níveis de Desconto</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-['Outfit'] tracking-tight">
            Orçamentos & Relacionamento de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Cotações rápidas com políticas de desconto por perfil (Consumidor, Cliente Fiel, Mecânica e Frotista), histórico completo e conversão em venda com NF-e e baixa automática no estoque.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewCustomerModal(true)}
            id="btn-open-new-customer"
            className="flex items-center gap-2 bg-[#0C4A6E] hover:bg-[#0C4A6E]/90 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl p-1.5 border border-sky-50 shadow-xs flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('orcamentos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'orcamentos' 
              ? 'bg-[#0C4A6E] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Histórico de Orçamentos ({quotes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'clientes' 
              ? 'bg-[#0C4A6E] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cadastro de Clientes ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('politicas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'politicas' 
              ? 'bg-[#0C4A6E] text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Políticas de Desconto por Nível</span>
        </button>
      </div>

      {/* TAB 1: HISTÓRICO DE ORÇAMENTOS */}
      {activeTab === 'orcamentos' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-sky-50 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por número do orçamento, nome do cliente, CPF/CNPJ ou peça cotada..."
                value={searchQuoteTerm}
                onChange={(e) => setSearchQuoteTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
              {['all', 'Pendente', 'Aprovado', 'Convertido', 'Recusado'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedQuoteStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                    selectedQuoteStatus === st
                      ? 'bg-[#0284C7] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Quotes List Table */}
          <div className="bg-white rounded-2xl border border-sky-50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Cotação & Data</th>
                    <th className="py-3 px-4">Cliente / Perfil</th>
                    <th className="py-3 px-4 text-center">Itens</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Desconto</th>
                    <th className="py-3 px-4 text-right">Total Final</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Nenhum orçamento encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-sky-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-black text-[#0C4A6E]">
                            {quote.quoteNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(quote.createdAt).toLocaleDateString('pt-BR')} • Válido até {new Date(quote.validUntil).toLocaleDateString('pt-BR')}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{quote.customerName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">{quote.customerDocument}</span>
                            {renderCustomerTypeBadge(quote.customerType)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-full font-bold font-mono text-slate-700">
                            {quote.items.length} un
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {formatBRL(quote.subtotalAmount)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                          - {formatBRL(quote.discountAmount)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {formatBRL(quote.totalAmount)}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            ICMS: {formatBRL(quote.taxAmount)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {renderQuoteStatusBadge(quote.status)}
                          {quote.convertedNfeNumber && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              NF-e: {quote.convertedNfeNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingQuote(quote)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {quote.status !== 'Convertido' && (
                              <button
                                type="button"
                                onClick={() => handleConvertQuote(quote)}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] shadow-xs transition active:scale-95 cursor-pointer"
                                title="Faturar, Dar Baixa no Estoque e Emitir NF-e"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Converter em Venda (NF-e)</span>
                              </button>
                            )}

                            {quote.status === 'Pendente' && (
                              <button
                                type="button"
                                onClick={() => handleSetQuoteStatus(quote.id, 'Aprovado')}
                                className="p-1.5 text-[#0284C7] hover:bg-sky-50 rounded-lg transition"
                                title="Marcar como Aprovado"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CADASTRO DE CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="bg-white rounded-2xl p-4 border border-sky-50 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, documento, telefone ou cidade..."
                value={searchCustomerTerm}
                onChange={(e) => setSearchCustomerTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setSelectedCustomerType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCustomerType === 'all' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerType('consumidor')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCustomerType === 'consumidor' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Consumidor
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerType('cliente_fiel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCustomerType === 'cliente_fiel' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Cliente Fiel
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerType('mecanica')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCustomerType === 'mecanica' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Oficinas
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerType('frotista')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCustomerType === 'frotista' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Frotistas
              </button>
            </div>
          </div>

          {/* Customers Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c) => {
              const customerQuotes = quotes.filter(q => q.customerId === c.id || q.customerDocument === c.document);
              return (
                <div 
                  key={c.id} 
                  className="bg-white rounded-2xl p-5 border border-sky-50 shadow-sm flex flex-col justify-between hover:border-[#0284C7] transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">{c.name}</h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{c.document}</p>
                      </div>
                      {renderCustomerTypeBadge(c.type)}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone || 'Telefone não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{c.email || 'E-mail não cadastrado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.city} - {c.uf}</span>
                      </div>
                    </div>

                    {/* Policy and stats */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Desconto Fixo</span>
                        <span className="text-sm font-black text-emerald-700 font-mono">{c.discountRate}% OFF</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Orçamentos</span>
                        <span className="text-sm font-black text-[#0C4A6E] font-mono">{customerQuotes.length} reg.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerForHistory(c)}
                      className="text-xs font-bold text-[#0284C7] hover:underline"
                    >
                      Ver Histórico de Cotações
                    </button>

                    {onNavigateToQuoteWithCustomer && (
                      <button
                        type="button"
                        onClick={() => onNavigateToQuoteWithCustomer(c)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#0C4A6E] hover:bg-[#0C4A6E]/90 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        <span>Nova Cotação</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POLÍTICAS DE DESCONTO POR NÍVEL */}
      {activeTab === 'politicas' && (
        <div className="space-y-4">
          <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <h4 className="font-bold text-slate-800 text-sm">Políticas de Desconto no Balcão</h4>
              <p className="mt-0.5">
                Defina o percentual de desconto concedido automaticamente a cada categoria de cliente ao abrir um orçamento. A taxa pode ser ajustada individualmente na cotação caso o vendedor possua alçada comercial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {policies.map((pol) => (
              <div 
                key={pol.type}
                className="bg-white rounded-2xl p-5 border border-sky-50 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {renderCustomerTypeBadge(pol.type)}
                    <span className="text-xl font-black text-[#0C4A6E] font-mono">
                      {pol.defaultDiscountPercent}%
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm mb-1">{pol.label}</h3>
                  <p className="text-xs text-slate-500">{pol.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPolicy(pol)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-[#0284C7] rounded-lg text-xs font-bold text-slate-700 hover:text-[#0284C7] transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Configurar Alíquota</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVO CLIENTE */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Cadastrar Novo Cliente</h3>
              <button 
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome / Razão Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Oficina Mecânica Estrela do Norte"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nível de Relacionamento *</label>
                  <select
                    value={newCustomerForm.type}
                    onChange={(e) => {
                      const t = e.target.value as CustomerType;
                      const pol = policies.find(p => p.type === t);
                      setNewCustomerForm({ 
                        ...newCustomerForm, 
                        type: t,
                        discountRate: pol?.defaultDiscountPercent || 0,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="consumidor">Consumidor Final</option>
                    <option value="cliente_fiel">Cliente Fiel</option>
                    <option value="mecanica">Oficina Mecânica</option>
                    <option value="frotista">Frotista / Transportadora</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newCustomerForm.document}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, document: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newCustomerForm.uf}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, uf: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg uppercase text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Desconto Especial (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newCustomerForm.discountRate}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, discountRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Limite de Crédito (R$)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={newCustomerForm.creditLimit}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-customer"
                  className="px-5 py-2 bg-[#0C4A6E] hover:bg-[#0C4A6E]/90 text-white font-bold rounded-xl shadow-xs transition"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR ALÍQUOTA DE POLÍTICA */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">
              Ajustar Política: {editingPolicy.label}
            </h3>
            <form onSubmit={handleSavePolicy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Percentual de Desconto Padrão (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={editingPolicy.defaultDiscountPercent}
                  onChange={(e) => setEditingPolicy({ 
                    ...editingPolicy, 
                    defaultDiscountPercent: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-lg text-center text-[#0284C7]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição do Nível
                </label>
                <textarea
                  rows={3}
                  value={editingPolicy.description}
                  onChange={(e) => setEditingPolicy({ 
                    ...editingPolicy, 
                    description: e.target.value 
                  })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0C4A6E] hover:bg-[#0C4A6E]/90 text-white font-bold rounded-xl shadow-xs"
                >
                  Salvar Política
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE COTAÇÕES POR CLIENTE */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Histórico de Orçamentos: {selectedCustomerForHistory.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCustomerForHistory.document} • {selectedCustomerForHistory.discountRate}% desconto configurado
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForHistory(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 text-xs">
              {quotes.filter(q => q.customerId === selectedCustomerForHistory.id || q.customerDocument === selectedCustomerForHistory.document).length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Nenhum orçamento registrado para este cliente ainda.
                </div>
              ) : (
                quotes.filter(q => q.customerId === selectedCustomerForHistory.id || q.customerDocument === selectedCustomerForHistory.document).map(q => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0C4A6E]">{q.quoteNumber}</span>
                        {renderQuoteStatusBadge(q.status)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {q.items.length} peça(s) cotada(s) • Criado em {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatBRL(q.totalAmount)}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          Desc: {formatBRL(q.discountAmount)}
                        </div>
                      </div>

                      {q.status !== 'Convertido' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerForHistory(null);
                            handleConvertQuote(q);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs"
                        >
                          Faturar NF-e
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerForHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR DETALHES DO ORÇAMENTO (LAYOUT PRONTO PARA IMPRESSÃO/WHATSAPP) */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Orçamento Comercial: {viewingQuote.quoteNumber}
                  </h3>
                  {renderQuoteStatusBadge(viewingQuote.status)}
                </div>
                <p className="text-xs text-slate-500">
                  Cliente: <strong>{viewingQuote.customerName}</strong> ({viewingQuote.customerDocument})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingQuote(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quote details list */}
            <div className="overflow-y-auto space-y-2 flex-1 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Item / Código</th>
                      <th className="py-2 px-3 text-center">Qtd</th>
                      <th className="py-2 px-3 text-right">Unitário</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingQuote.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{it.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{it.productCode} • {it.locationStr}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatBRL(it.finalUnitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{formatBRL(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal da Tabela:</span>
                  <span className="font-mono">{formatBRL(viewingQuote.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto Concedido:</span>
                  <span className="font-mono">- {formatBRL(viewingQuote.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Estimativa Tributária ICMS:</span>
                  <span className="font-mono">{formatBRL(viewingQuote.taxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-black text-sm">
                  <span>Valor Total da Cotação:</span>
                  <span className="font-mono text-base text-[#0C4A6E]">{formatBRL(viewingQuote.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Orçamento</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingQuote(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs"
                >
                  Fechar
                </button>
                {viewingQuote.status !== 'Convertido' && (
                  <button
                    type="button"
                    onClick={() => {
                      const q = viewingQuote;
                      setViewingQuote(null);
                      handleConvertQuote(q);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Converter em Venda & Emitir NF-e
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
