import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Sun, Moon, Download, Upload, KeyRound, AlertTriangle, Keyboard, CheckCircle2, Sparkles, Layers, ArrowUpDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useFinanceStore } from '@/store/financeStore';
import { changePassword, reauthenticate } from '@/firebase/auth.service';
import { resetUserData } from '@/firebase/account.service';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, currentMonth } from '@/utils/format';
import { downloadFile, transactionsToCsv, importTransactionsFromJsonOrCsv } from '@/utils/exportData';

const SHORTCUTS = [
  ['I', 'Add Income'], ['E', 'Add Expense'], ['D', 'Add Full Day Expenses'],
  ['T', 'Transactions'], ['W', 'Wallets'], ['B', 'Budget'], ['G', 'Goals'],
  ['C', 'Calendar'], ['A', 'Analytics'], ['S', 'Settings'],
  ['Ctrl + K', 'Search'], ['Esc', 'Close Modal'],
];

export function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme, cardStyle, setCardStyle } = useUIStore();
  const { wallets, transactions, goals, budget, importTransactions } = useFinanceStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportRange, setExportRange] = useState('current-month');
  const [isImporting, setIsImporting] = useState(false);

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { isSubmitting: pwSubmitting } } = useForm<{ currentPassword: string; newPassword: string }>();

  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsedRows = importTransactionsFromJsonOrCsv(text, file.name, wallets);
      if (parsedRows.length === 0) {
        toast('No valid transaction records found in file', 'error');
        return;
      }
      const count = await importTransactions(parsedRows);
      toast(`Successfully imported ${count} transaction${count === 1 ? '' : 's'}!`, 'success');
    } catch (err: any) {
      toast(`Failed to import file: ${err?.message || 'Invalid format'}`, 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const onChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast('Password updated', 'success');
      resetPw();
    } catch {
      toast('Failed to update password. Check your current password.', 'error');
    }
  };

  const handleExport = () => {
    let txs = [...transactions];
    if (exportRange === 'current-month') {
      const ym = currentMonth();
      txs = txs.filter((t) => t.date.startsWith(ym));
    }
    const filename = `ledger_export_${exportRange}_${Date.now()}`;
    if (exportFormat === 'csv') {
      downloadFile(transactionsToCsv(txs), `${filename}.csv`, 'text/csv');
    } else {
      downloadFile(JSON.stringify({ transactions: txs, wallets, goals, budget }, null, 2), `${filename}.json`, 'application/json');
    }
    toast(`Exported ${txs.length} transactions as ${exportFormat.toUpperCase()}`, 'success');
  };

  const handleReset = async () => {
    if (!user || !resetPassword) return;
    setResetting(true);
    try {
      await reauthenticate(resetPassword);
      await resetUserData(user.id);
      toast('All data reset successfully', 'success');
      setResetOpen(false);
      window.location.reload();
    } catch {
      toast('Incorrect password', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <LeatherCard className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="leather-emboss-icon w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-semibold text-gold-300">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-cream-50">{user?.name}</p>
              <p className="text-sm text-cream-50/50">@{user?.username}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Transactions" value={String(transactions.length)} />
            <Stat label="Wallets" value={String(wallets.length)} />
            <Stat label="Savings Goals" value={String(goals.length)} />
            <Stat label="Total Saved" value={formatCurrency(totalSaved)} />
            <Stat label="Monthly Budget" value={formatCurrency(budget?.amount ?? 0)} />
            <Stat label="Total Expenses" value={formatCurrency(totalExpenses)} />
          </div>
        </LeatherCard>

        {/* Theme & Card Style */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4">Appearance & Style</p>

          {/* Card Surface Style Toggle */}
          <div className="mb-5 p-3 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-xs text-cream-50/60 font-medium mb-2.5">Surface Material Design</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <GlassButton
                variant={cardStyle === 'leather' ? 'primary' : 'ghost'}
                onClick={() => setCardStyle('leather')}
                full
                className="justify-between"
              >
                <span className="flex items-center gap-2">
                  <Layers size={15} /> Artisan Leather Craft
                </span>
                {cardStyle === 'leather' && <CheckCircle2 size={16} />}
              </GlassButton>

              <GlassButton
                variant={cardStyle === 'glass' ? 'primary' : 'ghost'}
                onClick={() => setCardStyle('glass')}
                full
                className="hidden lg:flex justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={15} /> Frosted Crystal Glass
                </span>
                {cardStyle === 'glass' && <CheckCircle2 size={16} />}
              </GlassButton>

              <div className="lg:hidden text-[11px] text-cream-50/60 p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                <span>To experience Glass UI, switch to desktop mode.</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-cream-50/60 font-medium mb-2.5">
            {cardStyle === 'glass' ? 'Frosted Glass Color Atmosphere' : 'Artisan Leather Color Palette'}
          </p>

          {cardStyle === 'glass' ? (
            /* Glass UI Solid Color Options */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <GlassButton
                variant={theme === 'maroon' ? 'primary' : 'ghost'}
                onClick={() => setTheme('maroon')}
                full
                className="justify-between"
              >
                <span>Imperial Velvet</span> {theme === 'maroon' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'navy' ? 'primary' : 'ghost'}
                onClick={() => setTheme('navy')}
                full
                className="justify-between"
              >
                <span>Sapphire Reserve</span> {theme === 'navy' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'olive' ? 'primary' : 'ghost'}
                onClick={() => setTheme('olive')}
                full
                className="justify-between"
              >
                <span>Emerald Solstice</span> {theme === 'olive' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'charcoal' ? 'primary' : 'ghost'}
                onClick={() => setTheme('charcoal')}
                full
                className="justify-between"
              >
                <span>Obsidian Noir</span> {theme === 'charcoal' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'espresso' ? 'primary' : 'ghost'}
                onClick={() => setTheme('espresso')}
                full
                className="justify-between"
              >
                <span>Rose Quartz</span> {theme === 'espresso' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'tan' ? 'primary' : 'ghost'}
                onClick={() => setTheme('tan')}
                full
                className="justify-between"
              >
                <span>Solar Amber</span> {theme === 'tan' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'brown' ? 'primary' : 'ghost'}
                onClick={() => setTheme('brown')}
                full
                className="sm:col-span-2 justify-between"
              >
                <span>Vintage Cognac Glass</span> {theme === 'brown' && <CheckCircle2 size={16} />}
              </GlassButton>
            </div>
          ) : (
            /* Leather UI Color Options */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <GlassButton
                variant={theme === 'brown' ? 'primary' : 'ghost'}
                onClick={() => setTheme('brown')}
                full
                className="justify-between"
              >
                <span>Vintage Cognac Reserve</span> {theme === 'brown' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'charcoal' ? 'primary' : 'ghost'}
                onClick={() => setTheme('charcoal')}
                full
                className="justify-between"
              >
                <span>Midnight Obsidian Craft</span> {theme === 'charcoal' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'maroon' ? 'primary' : 'ghost'}
                onClick={() => setTheme('maroon')}
                full
                className="justify-between"
              >
                <span>Crimson Reserve</span> {theme === 'maroon' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'olive' ? 'primary' : 'ghost'}
                onClick={() => setTheme('olive')}
                full
                className="justify-between"
              >
                <span>Heritage Moss Craft</span> {theme === 'olive' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'navy' ? 'primary' : 'ghost'}
                onClick={() => setTheme('navy')}
                full
                className="justify-between"
              >
                <span>Midnight Navy Leather</span> {theme === 'navy' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'tan' ? 'primary' : 'ghost'}
                onClick={() => setTheme('tan')}
                full
                className="justify-between"
              >
                <span>Saddle Tan Heritage</span> {theme === 'tan' && <CheckCircle2 size={16} />}
              </GlassButton>
              <GlassButton
                variant={theme === 'espresso' ? 'primary' : 'ghost'}
                onClick={() => setTheme('espresso')}
                full
                className="sm:col-span-2 justify-between"
              >
                <span>Espresso Roast Craft</span> {theme === 'espresso' && <CheckCircle2 size={16} />}
              </GlassButton>
            </div>
          )}
        </LeatherCard>

        {/* Change password */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4 flex items-center gap-1.5"><KeyRound size={13} /> Security</p>
          <form onSubmit={handlePw(onChangePassword)} className="flex flex-col gap-3">
            <Field label="Current password"><Input type="password" {...regPw('currentPassword', { required: true })} /></Field>
            <Field label="New password"><Input type="password" {...regPw('newPassword', { required: true, minLength: 6 })} /></Field>
            <GlassButton type="submit" variant="primary" disabled={pwSubmitting}>Update password</GlassButton>
          </form>
        </LeatherCard>

        {/* Data Management (Import & Export Data) */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4 flex items-center gap-1.5 font-semibold">
            <ArrowUpDown size={13} /> Data Management
          </p>

          {/* Export Section */}
          <div className="flex flex-col gap-2.5 mb-5 pb-4 border-b border-white/10">
            <p className="text-xs font-semibold text-gold-300 flex items-center gap-1.5">
              <Download size={13} /> Export Data
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Range">
                <Select value={exportRange} onChange={(e) => setExportRange(e.target.value)}>
                  <option value="current-month">Current Month</option>
                  <option value="all">All Time</option>
                </Select>
              </Field>
              <Field label="Format">
                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </Select>
              </Field>
            </div>
            <GlassButton variant="primary" size="sm" onClick={handleExport} className="w-full justify-center">
              <Download size={14} /> Download Export
            </GlassButton>
          </div>

          {/* Import Section */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Upload size={13} /> Import Data
            </p>
            <p className="text-[11px] text-cream-50/60 leading-normal">
              Import transactions from JSON backup or CSV files. Automatically links wallets and entries.
            </p>
            <label className="block w-full">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                disabled={isImporting}
                className="hidden"
                id="import-file-input"
              />
              <GlassButton
                type="button"
                variant="primary"
                size="sm"
                full
                disabled={isImporting}
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <Upload size={14} /> {isImporting ? 'Importing…' : 'Select CSV / JSON file'}
              </GlassButton>
            </label>
          </div>
        </LeatherCard>

        {/* Keyboard shortcuts */}
        <LeatherCard>
          <p className="text-xs uppercase tracking-wide text-cream-50/50 mb-4 flex items-center gap-1.5"><Keyboard size={13} /> Keyboard Shortcuts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-cream-50/60">{label}</span>
                <kbd className="px-2 py-0.5 text-[11px] font-mono glass-surface rounded">{key}</kbd>
              </div>
            ))}
          </div>
        </LeatherCard>

        {/* Danger zone */}
        <LeatherCard className="lg:col-span-2 !border-red-500/20">
          <p className="text-xs uppercase tracking-wide text-red-300/80 mb-2 flex items-center gap-1.5"><AlertTriangle size={13} /> Danger Zone</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-cream-50">Reset all ledger data</p>
              <p className="text-xs text-cream-50/50">Permanently delete all transactions, wallets, goals, and budget records.</p>
            </div>
            <GlassButton variant="danger" onClick={() => setResetOpen(true)}>Reset account data</GlassButton>
          </div>
        </LeatherCard>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Account Data" size="sm">
        <p className="text-sm text-cream-50/80 mb-4">This action cannot be undone. Enter your password to confirm reset.</p>
        <Field label="Password">
          <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} autoFocus />
        </Field>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-4">
          <GlassButton variant="ghost" onClick={() => setResetOpen(false)} className="w-full sm:w-auto">Cancel</GlassButton>
          <GlassButton variant="danger" onClick={handleReset} disabled={!resetPassword || resetting} className="w-full sm:w-auto">
            {resetting ? 'Resetting…' : 'Reset everything'}
          </GlassButton>
        </div>
      </Modal>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
      <p className="text-[11px] text-cream-50/45 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-display text-lg font-semibold text-cream-50">{value}</p>
    </div>
  );
}
