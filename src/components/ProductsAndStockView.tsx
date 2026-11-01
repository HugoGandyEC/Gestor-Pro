import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Upload, 
  FileCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  Search, 
  Tag, 
  Trash2, 
  Edit3, 
  Copy,
  CheckCircle2, 
  Layers,
  FileText,
  Percent,
  Sparkles,
  Boxes,
  Barcode,
  History,
  Calendar,
  Camera,
  Image as ImageIcon,
  Eye,
  X,
  TrendingUp,
  ScanBarcode,
  ShoppingBag,
  Wrench,
  DollarSign
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { Product, ParsedXmlNFe } from '../types';
import { NFeImportStagingModal } from './NFeImportStagingModal';

export const ProductsAndStockView: React.FC = () => {
  const { 
    products, 
    stockMovements, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    parseNFeXml,
    importNFeXml,
    currentRole,
    serviceOrders,
    directSales
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'xml'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');

  // Staging Modal State for NFe Import with Margin & Price Adjustment
  const [stagingNFe, setStagingNFe] = useState<ParsedXmlNFe | null>(null);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);

  // Modal Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState('Reservatórios Térmicos');
  const [costPrice, setCostPrice] = useState<number>(1000);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(60);
  const [retailPrice, setRetailPrice] = useState<number>(1600);
  const [wholesalePrice, setWholesalePrice] = useState<number>(1400);
  const [currentStock, setCurrentStock] = useState<number>(5);
  const [minStock, setMinStock] = useState<number>(2);
  const [unit, setUnit] = useState('UN');
  const [ncm, setNcm] = useState('8419.19.10');
  const [icmsRate, setIcmsRate] = useState<number>(12);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // Total History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // XML Import State
  const [xmlText, setXmlText] = useState('');
  const [xmlResult, setXmlResult] = useState<{ success: boolean; message: string } | null>(null);

  const sampleXmlExample = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35241061423789000115550010000189241000189245">
      <ide>
        <nNF>18924</nNF>
        <dhEmi>2026-10-28T10:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>61.423.789/0001-15</CNPJ>
        <xNome>TermoMax Indústria de Reservatórios Térmicos Ltda</xNome>
        <xFant>TermoMax Boilers</xFant>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>BOIL-600-AP</cProd>
          <cEAN>7898901234567</cEAN>
          <xProd>Reservatório Térmico Boiler 600L Alta Pressão Inox 316</xProd>
          <NCM>8419.19.10</NCM>
          <qCom>5.0000</qCom>
          <vUnCom>3850.0000</vUnCom>
          <vProd>19250.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>VAL-ALIV-3B</cProd>
          <xProd>Válvula de Segurança e Alívio de Pressão 3/4 3 Bar</xProd>
          <NCM>8481.40.00</NCM>
          <qCom>15.0000</qCom>
          <vUnCom>65.0000</vUnCom>
          <vProd>975.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>20225.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

  const sampleXmlNewSupplier = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35241099888777000144550010000452101000452109">
      <ide>
        <nNF>45210</nNF>
        <dhEmi>2026-10-31T14:15:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>22.888.999/0001-44</CNPJ>
        <xNome>Solarium Indústria & Caldeiraria Térmica S/A</xNome>
        <xFant>Solarium Térmica</xFant>
        <enderEmit>
          <xLgr>Rodovia Anhanguera</xLgr>
          <nro>Km 142</nro>
          <xBairro>Parque Industrial</xBairro>
          <cMun>3526902</cMun>
          <xMun>Limeira</xMun>
          <UF>SP</UF>
          <CEP>13480-000</CEP>
          <fone>(19) 3404-8800</fone>
        </enderEmit>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>SOL-BOIL-800</cProd>
          <xProd>Reservatório Térmico Boiler Solar 800L Alta Pressão Inox 316L</xProd>
          <NCM>8419.19.10</NCM>
          <qCom>3.0000</qCom>
          <vUnCom>4900.0000</vUnCom>
          <vProd>14700.00</vProd>
          <uCom>UN</uCom>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>BOM-CIR-SOL-12</cProd>
          <xProd>Bomba Circuladora Solar Bronze 1/2 CV Blindada</xProd>
          <NCM>8413.70.80</NCM>
          <qCom>6.0000</qCom>
          <vUnCom>420.0000</vUnCom>
          <vProd>2520.00</vProd>
          <uCom>UN</uCom>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>TUB-PPR-32MM</cProd>
          <xProd>Tubo PPR Fibras 32mm Água Quente Barra 3m</xProd>
          <NCM>3917.22.00</NCM>
          <qCom>20.0000</qCom>
          <vUnCom>48.0000</vUnCom>
          <vProd>960.00</vProd>
          <uCom>PC</uCom>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>18180.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

  // Generator for valid 13-digit EAN-13 barcode
  const generateEan13 = () => {
    const prefix = '789';
    let digits = prefix;
    for (let i = 0; i < 9; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(digits[i]);
      sum += i % 2 === 0 ? d * 1 : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    const fullBarcode = digits + (check === 10 ? 0 : check);
    setBarcode(fullBarcode);
  };

  // Two-way margin calculations
  const handleCostChange = (newCost: number) => {
    setCostPrice(newCost);
    if (profitMarginPercent > 0) {
      const calcRetail = Number((newCost * (1 + profitMarginPercent / 100)).toFixed(2));
      setRetailPrice(calcRetail);
    }
  };

  const handleMarginChange = (newMargin: number) => {
    setProfitMarginPercent(newMargin);
    if (costPrice > 0) {
      const calcRetail = Number((costPrice * (1 + newMargin / 100)).toFixed(2));
      setRetailPrice(calcRetail);
    }
  };

  const handleRetailChange = (newRetail: number) => {
    setRetailPrice(newRetail);
    if (costPrice > 0) {
      const margin = Number((((newRetail - costPrice) / costPrice) * 100).toFixed(1));
      setProfitMarginPercent(margin);
    }
  };

  // Photo handlers (up to 3 photos)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setPhotos(prev => {
          const next = [...prev];
          next[slotIdx] = base64;
          return next.slice(0, 3);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    setPhotos(prev => {
      if (prev.length >= 3) return prev;
      return [...prev, photoUrlInput.trim()];
    });
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (slotIdx: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== slotIdx));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    generateEan13();
    setName('');
    setModel('');
    setDate(new Date().toISOString().split('T')[0]);
    setSerialNumber('');
    setCategory('Reservatórios Térmicos');
    setCostPrice(1000);
    setProfitMarginPercent(60);
    setRetailPrice(1600);
    setWholesalePrice(1400);
    setCurrentStock(5);
    setMinStock(2);
    setUnit('UN');
    setNcm('8419.19.10');
    setDescription('');
    setPhotos([]);
    setIsDuplicating(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setIsDuplicating(false);
    setCode(p.code);
    setBarcode(p.barcode || '');
    setName(p.name);
    setModel(p.model || '');
    setDate(p.date || new Date().toISOString().split('T')[0]);
    setSerialNumber(p.serialNumber || '');
    setCategory(p.category);
    setCostPrice(p.costPrice);
    const margin = p.profitMarginPercent !== undefined 
      ? p.profitMarginPercent 
      : (p.costPrice > 0 ? Number((((p.retailPrice - p.costPrice) / p.costPrice) * 100).toFixed(1)) : 50);
    setProfitMarginPercent(margin);
    setRetailPrice(p.retailPrice);
    setWholesalePrice(p.wholesalePrice);
    setCurrentStock(p.currentStock);
    setMinStock(p.minStock);
    setUnit(p.unit);
    setNcm(p.ncm);
    setIcmsRate(p.icmsRate);
    setDescription(p.description || '');
    setPhotos(p.photos ? [...p.photos] : []);
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = (p: Product) => {
    setEditingId(null);
    setIsDuplicating(true);
    setCode(`${p.code}-COP`);
    // Generate new unique barcode for the clone
    const prefix = '789';
    let digits = prefix;
    for (let i = 0; i < 9; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(digits[i]);
      sum += i % 2 === 0 ? d * 1 : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    setBarcode(digits + (check === 10 ? 0 : check));

    setName(`${p.name} (Cópia)`);
    setModel(p.model || '');
    setDate(new Date().toISOString().split('T')[0]);
    setSerialNumber(p.serialNumber ? `${p.serialNumber}-COP` : '');
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setProfitMarginPercent(p.profitMarginPercent || 50);
    setRetailPrice(p.retailPrice);
    setWholesalePrice(p.wholesalePrice);
    setCurrentStock(0);
    setMinStock(p.minStock);
    setUnit(p.unit);
    setNcm(p.ncm);
    setIcmsRate(p.icmsRate);
    setDescription(p.description || '');
    setPhotos(p.photos ? [...p.photos] : []);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const productPayload = {
      code,
      barcode: barcode.trim() || undefined,
      name,
      model: model.trim() || undefined,
      date,
      serialNumber: serialNumber.trim() || undefined,
      category,
      costPrice: Number(costPrice),
      profitMarginPercent: Number(profitMarginPercent),
      retailPrice: Number(retailPrice),
      wholesalePrice: Number(wholesalePrice),
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      unit,
      ncm,
      icmsRate: Number(icmsRate),
      description: description.trim() || undefined,
      photos: photos.filter(Boolean)
    };

    if (editingId) {
      updateProduct(editingId, productPayload);
    } else {
      addProduct({
        ...productPayload,
        pisRate: 1.65,
        cofinsRate: 7.6
      });
    }

    setIsProductModalOpen(false);
  };

  const handleOpenHistory = (p: Product) => {
    setSelectedProductForHistory(p);
    setIsHistoryModalOpen(true);
  };

  const handleProcessXmlForReview = (contentToParse?: string) => {
    const content = contentToParse !== undefined ? contentToParse : xmlText;
    if (!content.trim()) {
      alert('Insira ou cole o conteúdo do XML da NF-e.');
      return;
    }
    const res = parseNFeXml(content);
    if (res.success && res.parsedNFe) {
      setStagingNFe(res.parsedNFe);
      setIsStagingModalOpen(true);
      setXmlResult(null);
    } else {
      setXmlResult({ success: false, message: res.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setXmlText(content);
        handleProcessXmlForReview(content);
      };
      reader.readAsText(file);
    }
  };

  const handleStagingSuccess = (msg: string) => {
    setIsStagingModalOpen(false);
    setStagingNFe(null);
    setXmlResult({ success: true, message: msg });
    setActiveTab('products');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ncm.includes(searchTerm);
    const matchesCat = categoryFilter === 'todas' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#363739] tracking-tight">
              Catálogo de Produtos, Peças & Importação de XML
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
              Controle de Estoque & NF-e
            </span>
          </div>
          <p className="text-xs text-[#707174] mt-1">
            Gestão de reservatórios térmicos, bombas e peças com preços no atacado/varejo, alíquotas fiscais e entrada automática de compras via XML.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('xml')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#f4f5f6] transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#53383e]" />
            <span>Importar XML de NF-e</span>
          </button>

          {currentRole !== 'tecnico' && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d8d8d8] pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'products' ? 'bg-[#53383e] text-white shadow-xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          Produtos & Estoque ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'movements' ? 'bg-[#53383e] text-white shadow-xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          Movimentações de Estoque ({stockMovements.length})
        </button>
        <button
          onClick={() => setActiveTab('xml')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'xml' ? 'bg-[#53383e] text-white shadow-xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          Importador de XML NF-e
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por código, nome do produto ou NCM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'todas', label: 'Todas Categorias' },
                { id: 'Reservatórios Térmicos', label: 'Reservatórios Térmicos' },
                { id: 'Bombas e Motores', label: 'Bombas e Motores' },
                { id: 'Tubulações e Conexões', label: 'Tubos & Válvulas' },
                { id: 'Peças Gerais', label: 'Peças Gerais' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === cat.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Código / Categoria</th>
                    <th className="py-3 px-4">Descrição do Produto / Peça</th>
                    <th className="py-3 px-3">NCM / Imposto</th>
                    <th className="py-3 px-3 text-right">Custo Compra</th>
                    <th className="py-3 px-3 text-right">Venda Varejo</th>
                    <th className="py-3 px-3 text-right">Venda Atacado</th>
                    <th className="py-3 px-3 text-center">Estoque Atual</th>
                    {currentRole !== 'tecnico' && <th className="py-3 px-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredProducts.map(p => {
                    const isLow = p.currentStock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {p.photos && p.photos.length > 0 ? (
                              <img
                                src={p.photos[0]}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                <Package className="w-5 h-5 text-slate-300" />
                              </div>
                            )}
                            <div>
                              <div className="font-mono font-bold text-blue-600 flex items-center gap-1.5 flex-wrap">
                                <span>{p.code}</span>
                                {p.barcode && (
                                  <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {p.barcode}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-sans">{p.category}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                            <span>Unidade: <strong>{p.unit}</strong></span>
                            {p.model && (
                              <span>• Modelo: <strong className="text-slate-700">{p.model}</strong></span>
                            )}
                            {p.serialNumber && (
                              <span>• Série: <strong className="font-mono text-slate-700">{p.serialNumber}</strong></span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600">
                          <div>NCM: {p.ncm}</div>
                          <div className="text-[10px] text-slate-400">ICMS: {p.icmsRate}%</div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatBRL(p.costPrice)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatBRL(p.retailPrice)}</div>
                          {p.profitMarginPercent !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              +{p.profitMarginPercent}% margem
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-700">
                          {formatBRL(p.wholesalePrice)}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.currentStock} {p.unit}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">Mín: {p.minStock}</div>
                        </td>

                        {currentRole !== 'tecnico' && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenHistory(p)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                title="Histórico Total e Kardex do Produto"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="Duplicar produto no estoque"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Editar produto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir produto ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Excluir produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stock Movements */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Livro de Movimentações de Estoque (Kardex)
            </h2>
            <p className="text-xs text-slate-500">
              Rastreabilidade de entradas via XML de fornecedores e baixas automáticas em Ordens de Serviço e Vendas.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-3">Documento Ref.</th>
                <th className="py-3 px-3 text-center">Quantidade</th>
                <th className="py-3 px-4 text-right">Custo Unitário</th>
                <th className="py-3 px-4">Histórico / Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {stockMovements.map(m => {
                const isEntry = m.type.startsWith('entrada');
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{m.date}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{m.referenceDoc || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={isEntry ? 'text-emerald-700' : 'text-rose-700'}>
                        {isEntry ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{formatBRL(m.unitCost)}</td>
                    <td className="py-3 px-4 text-slate-500">{m.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: XML NF-e Importer */}
      {activeTab === 'xml' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Importador Automático de XML de NF-e de Compra
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Ao carregar a NF-e do fornecedor, o sistema lê automaticamente os dados da nota fiscal, cadastra ou atualiza os produtos no estoque, recalcula o custo e gera a Conta a Pagar vinculada ao CNPJ do fornecedor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setXmlText(sampleXmlExample);
                  setXmlResult(null);
                  handleProcessXmlForReview(sampleXmlExample);
                }}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Exemplo: Fornecedor Homologado (TermoMax)
              </button>

              <button
                type="button"
                onClick={() => {
                  setXmlText(sampleXmlNewSupplier);
                  setXmlResult(null);
                  handleProcessXmlForReview(sampleXmlNewSupplier);
                }}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Exemplo: Fornecedor Novo (Solarium S/A)
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700">Selecione o arquivo XML da NF-e no seu computador</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Formatos suportados: .xml (Padrão SEFAZ NF-e 4.0)</div>
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          {/* Direct XML text editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ou cole o código XML da NF-e abaixo:
            </label>
            <textarea
              rows={8}
              placeholder="Cole aqui o conteúdo <nfeProc> ou <NFe>..."
              value={xmlText}
              onChange={(e) => setXmlText(e.target.value)}
              className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {xmlResult && (
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  xmlResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{xmlResult.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleProcessXmlForReview()}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Percent className="w-4 h-4" />
              <span>Conferir & Ajustar Preços da NF-e →</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar/Clonar Produto com Todos os Campos Solicitados */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-[#53383e] text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  {isDuplicating ? <Copy className="w-5 h-5 text-emerald-400" /> : <Package className="w-5 h-5 text-indigo-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isDuplicating ? 'Duplicar / Clonar Produto no Catálogo' : editingId ? 'Editar Produto do Catálogo' : 'Cadastrar Novo Produto no Estoque'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Preencha a ficha técnica completa, código de barras, fotos e parâmetros de margem de lucro.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto">
              {/* SEÇÃO 1: IDENTIFICAÇÃO, CÓDIGO E CÓDIGO DE BARRAS */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#53383e]" />
                  1. Identificação, Código & Código de Barras
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Código SKU / Referência *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#53383e] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">Código de Barras (EAN-13 / GTIN)</label>
                      <button
                        type="button"
                        onClick={generateEan13}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        title="Gerar código de barras brasileiro no padrão EAN-13"
                      >
                        <ScanBarcode className="w-3.5 h-3.5" /> Gerar Código
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 7898901234567"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full p-2 pl-8 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#53383e] focus:outline-hidden"
                      />
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nome Comercial do Produto / Peça *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reservatório Térmico Boiler 600L Alta Pressão Inox 316"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-[#53383e] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1 font-semibold">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ex: MaxTherm 600-AP Inox 316L"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Número de Série</label>
                    <input
                      type="text"
                      placeholder="Ex: SN-2026-9921"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Categoria do Produto</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="Reservatórios Térmicos">Reservatórios Térmicos</option>
                      <option value="Bombas e Motores">Bombas e Motores</option>
                      <option value="Tubulações e Conexões">Tubulações e Conexões</option>
                      <option value="Insumos Elétricos">Insumos Elétricos</option>
                      <option value="Peças Gerais">Peças Gerais</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Unidade de Medida</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold uppercase text-slate-800"
                    >
                      <option value="UN">UN - Unidade</option>
                      <option value="PC">PC - Peça</option>
                      <option value="MT">MT - Metro</option>
                      <option value="CX">CX - Caixa</option>
                      <option value="KG">KG - Quilograma</option>
                      <option value="L">L - Litro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: PREÇO DE CUSTO, MARGEM DE LUCRO (%) E PREÇO DE VENDA */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    2. Custos, Margem de Lucro (%) & Preços de Venda
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Cálculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Preço de Custo (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={costPrice}
                      onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500">Custo unitário NF</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      Margem de Lucro (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={profitMarginPercent}
                        onChange={(e) => handleMarginChange(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 pr-7 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                      />
                      <Percent className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium">Markup sobre custo</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Preço Varejo (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={retailPrice}
                      onChange={(e) => handleRetailChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500">Preço balcão / OS</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Preço Atacado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-indigo-700 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500">Obras / instaladores</span>
                  </div>
                </div>

                {/* Profit KPI Mini-Banner */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Lucro Bruto Unitário:</span>
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      {formatBRL(retailPrice - costPrice)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Margem Real sobre Venda:</span>
                    <div className="font-mono font-bold text-slate-800 text-sm">
                      {retailPrice > 0 ? (((retailPrice - costPrice) / retailPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Multiplicador Markup:</span>
                    <div className="font-mono font-bold text-slate-800 text-sm">
                      {costPrice > 0 ? (retailPrice / costPrice).toFixed(2) : 1}x
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: ESTOQUE E FISCAL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Estoque Atual *</label>
                  <input
                    type="number"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">NCM Fiscal</label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Alíquota ICMS (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={icmsRate}
                    onChange={(e) => setIcmsRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* SEÇÃO 4: DESCRIÇÃO DETALHADA DO PRODUTO */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Descrição Detalhada / Ficha Técnica do Produto
                </label>
                <textarea
                  rows={3}
                  placeholder="Informações técnicas, especificações de diâmetro, pressão máxima suportada, compatibilidade com modelos de aquecedores, normas ABNT aplicáveis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed font-sans focus:ring-2 focus:ring-[#53383e] focus:outline-hidden"
                />
              </div>

              {/* SEÇÃO 5: LOCAL PARA INSERIR ATÉ 3 FOTOS */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#53383e]" />
                      Galeria de Fotos do Produto (Até 3 Fotos)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Adicione fotos reais do produto, embalagem ou esquema de conexões.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    {photos.length}/3 fotos inseridas
                  </span>
                </div>

                {/* 3 Photo Slots */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIdx) => {
                    const photo = photos[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`relative rounded-xl border-2 border-dashed p-3 flex flex-col items-center justify-center min-h-[140px] text-center transition-all ${
                          photo 
                            ? 'border-indigo-300 bg-white shadow-2xs' 
                            : 'border-slate-300 bg-white/70 hover:bg-white hover:border-slate-400'
                        }`}
                      >
                        {photo ? (
                          <div className="w-full h-full flex flex-col items-center justify-between space-y-2">
                            <img
                              src={photo}
                              alt={`Foto ${slotIdx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="text-[10px] font-bold text-slate-600 font-mono">
                                Foto #{slotIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(slotIdx)}
                                className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded-md transition-colors"
                                title="Remover esta foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-2 text-slate-500 hover:text-[#53383e]">
                            <ImageIcon className="w-8 h-8 text-slate-400 mb-1.5" />
                            <span className="text-[11px] font-bold">Adicionar Foto {slotIdx + 1}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Clique para carregar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(e, slotIdx)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick URL input */}
                {photos.length < 3 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="url"
                      placeholder="Ou cole a URL de uma imagem da internet (https://...)"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      disabled={!photoUrlInput.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                    >
                      Inserir URL
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isDuplicating ? 'Salvar Cópia do Produto' : editingId ? 'Atualizar Produto' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico Total do Produto (Kardex 360°, Entradas, Saídas em OS, Vendas Diretas e Lucro Bruto) */}
      {isHistoryModalOpen && selectedProductForHistory && (() => {
        const prod = selectedProductForHistory;

        // Collect all service order usages for this product
        const osUsages = serviceOrders.flatMap(os => 
          (os.parts || [])
            .filter(p => p.productId === prod.id || p.name.toLowerCase() === prod.name.toLowerCase())
            .map(p => ({
              id: `os-${os.id}-${p.id}`,
              date: os.openDate || '2026-10-01',
              type: 'saida_os' as const,
              docCode: os.code,
              clientName: os.clientName,
              quantity: p.quantity,
              unitPrice: p.price,
              unitCost: p.cost,
              totalPrice: p.price * p.quantity,
              totalCost: p.cost * p.quantity,
              notes: `Aplicação em Ordem de Serviço #${os.code}`
            }))
        );

        // Collect all direct sale usages for this product
        const saleUsages = directSales.flatMap(sale => 
          (sale.items || [])
            .filter(it => it.productId === prod.id || it.name.toLowerCase() === prod.name.toLowerCase())
            .map(it => ({
              id: `sale-${sale.id}-${it.id}`,
              date: sale.date,
              type: 'saida_venda' as const,
              docCode: sale.code,
              clientName: sale.clientName,
              quantity: it.quantity,
              unitPrice: it.price,
              unitCost: it.cost,
              totalPrice: it.price * it.quantity,
              totalCost: it.cost * it.quantity,
              notes: `Venda Direta / Balcão #${sale.code}`
            }))
        );

        // Collect all stock movements
        const movementsForProd = stockMovements.filter(m => 
          m.productId === prod.id || m.productName.toLowerCase() === prod.name.toLowerCase()
        );

        // Calculations
        const entriesMovements = movementsForProd.filter(m => m.type.startsWith('entrada'));
        const totalEntriesQty = entriesMovements.reduce((acc, m) => acc + m.quantity, 0) || (prod.currentStock > 0 ? prod.currentStock : 0);
        const totalEntriesValue = entriesMovements.reduce((acc, m) => acc + (m.quantity * (m.unitCost || prod.costPrice)), 0) || (totalEntriesQty * prod.costPrice);

        const totalExitsQty = osUsages.reduce((a, b) => a + b.quantity, 0) + saleUsages.reduce((a, b) => a + b.quantity, 0);
        const totalRevenue = osUsages.reduce((a, b) => a + b.totalPrice, 0) + saleUsages.reduce((a, b) => a + b.totalPrice, 0);
        const totalExitsCost = osUsages.reduce((a, b) => a + b.totalCost, 0) + saleUsages.reduce((a, b) => a + b.totalCost, 0);
        const totalGrossProfit = totalRevenue - totalExitsCost;
        const profitMarginReal = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-[#53383e] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <History className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{prod.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                        {prod.code}
                      </span>
                      {prod.barcode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          EAN: {prod.barcode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {prod.category} • Modelo: {prod.model || 'Padrão'} • Série: {prod.serialNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Estoque Atual */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-blue-600" />
                      Saldo em Estoque
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-900">
                      {prod.currentStock} <span className="text-sm font-normal text-slate-500">{prod.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Custo Imobilizado: <strong>{formatBRL(prod.currentStock * prod.costPrice)}</strong>
                    </div>
                  </div>

                  {/* Card 2: Total Comprado */}
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-indigo-700 flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                      Total Comprado (Entradas)
                    </div>
                    <div className="text-2xl font-bold font-mono text-indigo-950">
                      {totalEntriesQty} <span className="text-sm font-normal text-indigo-600">{prod.unit}</span>
                    </div>
                    <div className="text-[11px] text-indigo-800">
                      Investido em Compras: <strong>{formatBRL(totalEntriesValue)}</strong>
                    </div>
                  </div>

                  {/* Card 3: Total Vendido / Aplicado */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      Total Saídas (OS & Vendas)
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-950">
                      {totalExitsQty} <span className="text-sm font-normal text-emerald-600">{prod.unit}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Faturamento Gerado: <strong>{formatBRL(totalRevenue)}</strong>
                    </div>
                  </div>

                  {/* Card 4: Lucro Bruto Total */}
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      Lucro Bruto Total
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-950">
                      {formatBRL(totalGrossProfit)}
                    </div>
                    <div className="text-[11px] text-amber-900 font-semibold">
                      Margem Média: +{profitMarginReal.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Preço de Custo</span>
                    <div className="font-mono font-bold text-slate-800">{formatBRL(prod.costPrice)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Venda Varejo</span>
                    <div className="font-mono font-bold text-slate-900">{formatBRL(prod.retailPrice)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Venda Atacado</span>
                    <div className="font-mono font-bold text-indigo-700">{formatBRL(prod.wholesalePrice)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Margem Cadastrada</span>
                    <div className="font-mono font-bold text-emerald-700">+{prod.profitMarginPercent || 50}%</div>
                  </div>
                </div>

                {prod.description && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-0.5">Descrição Técnica / Especificações:</span>
                    {prod.description}
                  </div>
                )}

                {/* Timeline & Transactions Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#53383e]" />
                      Extrato Completo de Movimentações (Kardex & Rastreabilidade)
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {osUsages.length + saleUsages.length + movementsForProd.length} registros encontrados
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Data</th>
                            <th className="py-2.5 px-3">Tipo de Operação</th>
                            <th className="py-2.5 px-3">Documento Ref.</th>
                            <th className="py-2.5 px-3">Cliente / Destino / Fornecedor</th>
                            <th className="py-2.5 px-3 text-center">Quantidade</th>
                            <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                            <th className="py-2.5 px-3 text-right">Valor Total</th>
                            <th className="py-2.5 px-3 text-right">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {/* OS Usages */}
                          {osUsages.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-slate-600">{item.date}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Wrench className="w-3 h-3" /> Aplicação em OS
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                                {item.docCode}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium">
                                {item.clientName}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600">
                                -{item.quantity} {prod.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {formatBRL(item.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatBRL(item.totalPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                                +{formatBRL(item.totalPrice - item.totalCost)}
                              </td>
                            </tr>
                          ))}

                          {/* Direct Sale Usages */}
                          {saleUsages.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-slate-600">{item.date}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ShoppingBag className="w-3 h-3" /> Venda Balcão
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                                {item.docCode}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium">
                                {item.clientName}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600">
                                -{item.quantity} {prod.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {formatBRL(item.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatBRL(item.totalPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                                +{formatBRL(item.totalPrice - item.totalCost)}
                              </td>
                            </tr>
                          ))}

                          {/* Raw Movements (XML Entries & Adjustments) */}
                          {movementsForProd.map(m => {
                            const isEntry = m.type.startsWith('entrada');
                            return (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600">{m.date}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isEntry 
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {isEntry ? <ArrowDownLeft className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                                    {isEntry ? 'Entrada / NF-e XML' : 'Ajuste de Estoque'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">
                                  {m.referenceDoc || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {m.notes || 'Movimentação registrada'}
                                </td>
                                <td className={`py-2.5 px-3 text-center font-mono font-bold ${isEntry ? 'text-emerald-700' : 'text-slate-800'}`}>
                                  {isEntry ? `+${m.quantity}` : m.quantity} {prod.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                  {formatBRL(m.unitCost || prod.costPrice)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                  {formatBRL(m.quantity * (m.unitCost || prod.costPrice))}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                  -
                                </td>
                              </tr>
                            );
                          })}

                          {osUsages.length === 0 && saleUsages.length === 0 && movementsForProd.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                Nenhuma movimentação registrada até o momento para este produto.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Photos Gallery View inside History */}
                {prod.photos && prod.photos.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#53383e]" />
                      Fotos Registradas do Produto
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {prod.photos.map((ph, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                          <img
                            src={ph}
                            alt={`${prod.name} ${idx + 1}`}
                            className="w-28 h-28 object-cover hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Fechar Histórico
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Conferência e Precificação da Importação (Varejo, Atacado & Fornecedor) */}
      {isStagingModalOpen && stagingNFe && (
        <NFeImportStagingModal
          initialParsedNFe={stagingNFe}
          onClose={() => setIsStagingModalOpen(false)}
          onSuccess={handleStagingSuccess}
        />
      )}
    </div>
  );
};
