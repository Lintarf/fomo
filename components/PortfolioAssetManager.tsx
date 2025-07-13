import React, { useState } from 'react';
import { Asset } from '../types';
import { supabase, addPortfolioAsset, updatePortfolioAsset, deletePortfolioAsset } from '../services/supabaseService';
import ConfirmationModal from './ConfirmationModal';

interface PortfolioAssetManagerProps {
    userId: string;
    assets: Asset[];
    onAssetAdded: () => void;
    onAssetUpdated: () => void;
    onAssetDeleted: () => void;
}

interface AssetFormData {
    symbol: string;
    name: string;
    amount: string; // ubah ke string agar bisa input bebas
    avgBuyPrice: number;
    currentPrice: number;
    category: string; // Tambahkan default category
}

// Helper to get logo URL based on symbol (crypto only, fallback to default)
const getLogoUrl = (symbol: string) => {
    if (!symbol) return '';
    // Crypto icon CDN
    return `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@latest/svg/color/${symbol.toLowerCase()}.svg`;
};
const DEFAULT_ICON = 'https://via.placeholder.com/32x32?text=?';

const PortfolioAssetManager: React.FC<PortfolioAssetManagerProps> = ({
    userId,
    assets,
    onAssetAdded,
    onAssetUpdated,
    onAssetDeleted,
}) => {
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<AssetFormData>({
        symbol: '',
        name: '',
        amount: '',
        avgBuyPrice: 0,
        currentPrice: 0,
        category: 'Crypto', // Tambahkan default category
    });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const resetForm = () => {
        setFormData({
            symbol: '',
            name: '',
            amount: '',
            avgBuyPrice: 0,
            currentPrice: 0,
            category: 'Crypto', // Reset category
        });
        setIsAddingAsset(false);
        setEditingAsset(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'symbol') {
            setFormData(prev => ({
                ...prev,
                symbol: value.toUpperCase(),
            }));
        } else if (name === 'amount') {
            // Hanya izinkan angka, titik, minus, e/E
            const val = value.replace(/[^0-9eE.-]/g, '');
            setFormData(prev => ({
                ...prev,
                amount: val
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'avgBuyPrice' || name === 'currentPrice'
                    ? parseFloat(value) || 0
                    : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!supabase) {
            setErrorMsg('Database connection not available');
            return;
        }
        // Validasi amount
        const parsedAmount = parseFloat(formData.amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            setErrorMsg('Amount harus berupa angka valid dan lebih dari 0');
            return;
        }
        setIsLoading(true);
        try {
            const logoUrl = getLogoUrl(formData.symbol) || DEFAULT_ICON;
            console.log('[DEBUG] Mulai handleSubmit', { formData, parsedAmount, logoUrl, userId });
            if (editingAsset) {
                console.log('[DEBUG] Sebelum updatePortfolioAsset');
                await updatePortfolioAsset(supabase, editingAsset.id!, {
                    amount: parsedAmount,
                    avg_buy_price: formData.avgBuyPrice,
                    current_price: formData.currentPrice,
                    logo_url: logoUrl,
                }, userId);
                console.log('[DEBUG] Setelah updatePortfolioAsset');
                onAssetUpdated();
            } else {
                console.log('[DEBUG] Sebelum addPortfolioAsset', {
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name,
                    logo_url: logoUrl,
                    amount: parsedAmount,
                    avg_buy_price: formData.avgBuyPrice,
                    current_price: formData.currentPrice,
                }, userId);
                await addPortfolioAsset(supabase, {
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name,
                    logo_url: logoUrl,
                    amount: parsedAmount,
                    avg_buy_price: formData.avgBuyPrice,
                    current_price: formData.currentPrice,
                }, userId);
                console.log('[DEBUG] Setelah addPortfolioAsset');
                onAssetAdded();
            }
            resetForm();
        } catch (error: any) {
            console.error('[DEBUG] Error saving asset:', error);
            setErrorMsg('Gagal menyimpan asset: ' + (error?.message || error));
        } finally {
            setIsLoading(false);
            console.log('[DEBUG] Selesai handleSubmit');
        }
    };

    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setFormData({
            symbol: asset.symbol,
            name: asset.name,
            amount: asset.amount.toString(),
            avgBuyPrice: asset.avgBuyPrice,
            currentPrice: asset.currentPrice,
            category: asset.category ?? '', // Pastikan category diambil dari asset
        });
    };

    const handleDeleteClick = (asset: Asset) => {
        setDeleteTarget(asset);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!supabase || !deleteTarget?.id) return;
        setIsLoading(true);
        try {
            await deletePortfolioAsset(supabase, deleteTarget.id, userId);
            onAssetDeleted();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Error deleting asset. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {errorMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="absolute top-1 right-2 text-xl font-bold">×</button>
                </div>
            )}
            {/* Add Asset Button */}
            {!isAddingAsset && !editingAsset && (
                <button
                    onClick={() => setIsAddingAsset(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Asset
                </button>
            )}

            {/* Asset Form */}
            {(isAddingAsset || editingAsset) && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                        {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Symbol *
                                </label>
                                <input
                                    type="text"
                                    name="symbol"
                                    value={formData.symbol}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!editingAsset}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="BTC"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!editingAsset}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Bitcoin"
                                />
                            </div>
                            
                            {/* Logo URL field dihilangkan, otomatis di-backend */}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Amount *
                                </label>
                                <input
                                    type="text"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0.00000006"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Average Buy Price *
                                </label>
                                <input
                                    type="number"
                                    name="avgBuyPrice"
                                    value={formData.avgBuyPrice}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="45000.00"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Current Price *
                                </label>
                                <input
                                    type="number"
                                    name="currentPrice"
                                    value={formData.currentPrice}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="47000.00"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="Crypto">Crypto</option>
                                    <option value="Saham">Saham</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Saving...' : (editingAsset ? 'Update Asset' : 'Add Asset')}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={isLoading}
                                className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Assets List */}
            {assets.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Your Assets ({assets.length})
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Asset
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Avg Buy Price
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Current Price
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        P&L
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img 
                                                    src={asset.logoUrl || DEFAULT_ICON} 
                                                    alt={asset.name} 
                                                    className="h-8 w-8 rounded-full mr-3"
                                                    onError={(e) => {
                                                        e.currentTarget.src = DEFAULT_ICON;
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {asset.name}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        {asset.symbol}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-900 dark:text-slate-100">
                                            {asset.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-900 dark:text-slate-100">
                                            {formatCurrency(asset.avgBuyPrice)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-900 dark:text-slate-100">
                                            {formatCurrency(asset.currentPrice)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatCurrency(asset.value ?? 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <span className={(asset.totalPl ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                                {(asset.totalPl ?? 0) >= 0 ? '+' : ''}{formatCurrency(asset.totalPl ?? 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(asset)}
                                                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(asset)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {assets.length === 0 && !isAddingAsset && !editingAsset && (
                <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-slate-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No assets</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Get started by adding your first asset to your portfolio.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => setIsAddingAsset(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Asset
                        </button>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Asset"
                message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.symbol}) from your portfolio? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive
                isLoading={isLoading}
            />
        </div>
    );
};

export default PortfolioAssetManager; 