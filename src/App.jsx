import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Link2,
  CheckCircle2,
  AlertCircle,
  Circle,
  X,
  Search,
  Download,
  LogOut,
} from 'lucide-react';

const COLORS = {
  forest: '#1B4332',
  forestDark: '#0F2A20',
  orange: '#D97A2A',
  orangeDark: '#B7621B',
  cream: '#F6F1E4',
  card: '#FFFFFF',
  ink: '#26261F',
  sage: '#7A9483',
  line: '#E4DCC7',
  red: '#B23A2E',
};

const METHODS = ['MTN Mobile Money', 'Airtel Money', 'Bank Transfer', 'Cheque', 'Cash'];
const LEDGER_KEY = 'vinikam-payments-v1';
const AUTH_KEY = 'vinikam-auth-v1';
const TELLER_KEY = 'vinikam-tellers-v1';

const DEFAULT_ADMIN = {
  id: 'admin-1',
  username: 'admin',
  password: 'admin123',
  fullName: 'System Administrator',
  role: 'admin',
  branch: 'Head Office',
  status: 'active',
};

const DEFAULT_TELLERS = [
  {
    id: 'teller-1',
    username: 'teller1',
    password: 'teller123',
    fullName: 'Sarah Nakato',
    role: 'teller',
    branch: 'Main Branch',
    status: 'active',
  },
  {
    id: 'teller-2',
    username: 'teller2',
    password: 'teller456',
    fullName: 'Daniel Ssali',
    role: 'teller',
    branch: 'Kampala Branch',
    status: 'active',
  },
];

const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },
};

if (!window.storage) {
  window.storage = storage;
}

function fmt(n) {
  const num = Number(n) || 0;
  return 'UGX ' + num.toLocaleString('en-UG', { maximumFractionDigits: 0 });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadLedgerData() {
  const saved = storage.get(LEDGER_KEY, { orders: [], payments: [] });
  return {
    orders: Array.isArray(saved.orders) ? saved.orders : [],
    payments: Array.isArray(saved.payments) ? saved.payments : [],
  };
}

function loadTellers() {
  const saved = storage.get(TELLER_KEY, null);
  if (Array.isArray(saved) && saved.length) return saved;
  return DEFAULT_TELLERS;
}

function loadCurrentUser() {
  const saved = storage.get(AUTH_KEY, null);
  return saved ? saved : null;
}

function exportCsv(records) {
  const rows = [
    ['Date', 'Customer', 'Amount', 'Method', 'Reference', 'Recorded By', 'Branch'],
    ...records.map((entry) => [
      entry.date || '',
      entry.customer || '',
      String(Number(entry.amount) || 0),
      entry.method || '',
      entry.reference || '',
      entry.recordedBy || 'Admin',
      entry.branch || 'Head Office',
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'vinikam-report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function AuthScreen({ onLogin, tellers }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const ok = onLogin(username, password);
    if (!ok) setError('Invalid username or password.');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F2A20 0%, #1B4332 52%, #D97A2A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 28, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', color: COLORS.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>V</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Vinikam Portal</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Admin and teller access</div>
            </div>
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.95, marginBottom: 20 }}>
            Manage teller accounts, record payments, reconcile balances, and export full Excel-style reports from one platform.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            <MiniStat label="Portal users" value={tellers.length + 1} />
            <MiniStat label="Financial" value="Live" />
            <MiniStat label="Excel" value="CSV" />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.forest, marginBottom: 6 }}>Sign in</div>
          <div style={{ fontSize: 13, color: COLORS.sage, marginBottom: 18 }}>Login to your admin or teller dashboard</div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Username">
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="admin or teller1" />
            </Field>
            <Field label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" style={inputStyle} placeholder="Password" />
            </Field>
            {error && <div style={{ color: COLORS.red, fontSize: 12, fontWeight: 600 }}>{error}</div>}
            <button type="submit" style={{ background: COLORS.forest, color: '#fff', borderRadius: 10, padding: '12px 16px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Login to portal
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #EEE5D5' }}>
            <div style={{ fontSize: 12, color: COLORS.sage, marginBottom: 8, fontWeight: 700 }}>Demo access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: COLORS.ink }}>
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Teller:</strong> teller1 / teller123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: '10px 16px', background: COLORS.forest }}>
      <div style={{ fontSize: 10.5, color: '#9FBBA7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: accent || '#fff', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function MiniPanel({ label, value, tone }) {
  const palette = {
    forest: { bg: '#E8F3EE', color: COLORS.forest },
    orange: { bg: '#FCE8D8', color: COLORS.orangeDark },
    sage: { bg: '#EAF0EC', color: COLORS.sage },
    red: { bg: '#FBE5E1', color: COLORS.red },
  };
  const selected = palette[tone] || palette.forest;

  return (
    <div style={{ background: selected.bg, borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: selected.color, opacity: 0.9 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: selected.color, marginTop: 5 }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px' }}>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: '#F6F2EA', borderRadius: 12, padding: 12, border: `1px solid ${COLORS.line}` }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.sage }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.forest, marginTop: 5 }}>{value}</div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 18, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.forest, marginBottom: 4 }}>
      {label}
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 10px',
  border: `1px solid ${COLORS.line}`,
  borderRadius: 6,
  fontSize: 13.5,
  color: COLORS.ink,
  background: '#FCFAF3',
};

function StatusBadge({ status }) {
  const map = {
    paid: { color: '#1F7A46', bg: '#E4F3EA', label: 'Fully paid', icon: CheckCircle2 },
    partial: { color: COLORS.orangeDark, bg: '#FBEBDA', label: 'Partial', icon: AlertCircle },
    unpaid: { color: '#8A8272', bg: '#EFEADA', label: 'Unpaid', icon: Circle },
    over: { color: COLORS.red, bg: '#FBE4E1', label: 'Overpaid', icon: AlertCircle },
  };
  const details = map[status] || map.unpaid;
  const Icon = details.icon;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: details.color, background: details.bg, padding: '3px 8px', borderRadius: 20 }}>
      <Icon size={12} /> {details.label}
    </span>
  );
}

function EmptyState({ text, compact }) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '20px 10px' : '50px 20px', color: COLORS.sage, fontSize: 13 }}>
      {text}
    </div>
  );
}

function RecordPaymentPanel({ orders, onAdd }) {
  const [form, setForm] = useState({
    customer: '',
    amount: '',
    method: METHODS[0],
    date: todayISO(),
    reference: '',
    note: '',
    orderId: '',
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.customer.trim() || !Number(form.amount)) return;
    onAdd({
      customer: form.customer.trim(),
      amount: Number(form.amount),
      method: form.method,
      date: form.date,
      reference: form.reference.trim(),
      note: form.note.trim(),
      orderId: form.orderId || null,
    });

    setForm({ customer: '', amount: '', method: form.method, date: todayISO(), reference: '', note: '', orderId: '' });
  }

  return (
    <Card style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 14 }}>New payment</div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Customer / payer">
            <input style={inputStyle} value={form.customer} onChange={(e) => update('customer', e.target.value)} placeholder="e.g. Kaggwa Poultry Farm" />
          </Field>
        </div>
        <Field label="Amount (UGX)">
          <input style={inputStyle} type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Date">
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
        </Field>
        <Field label="Payment method">
          <select style={inputStyle} value={form.method} onChange={(e) => update('method', e.target.value)}>
            {METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </Field>
        <Field label="Reference / transaction ID">
          <input style={inputStyle} value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="Optional" />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Match to an order now (optional)">
            <select style={inputStyle} value={form.orderId} onChange={(e) => update('orderId', e.target.value)}>
              <option value="">Leave unmatched — reconcile later</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>{order.reference} — {order.customer} — {fmt(order.amount)}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Note">
            <textarea style={{ ...inputStyle, minHeight: 54, resize: 'vertical' }} value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Optional" />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <button className="vf-btn" type="submit" style={{ background: COLORS.orange, color: '#fff', padding: '10px 18px', borderRadius: 7, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Save payment
          </button>
        </div>
      </form>
    </Card>
  );
}

function OrdersPanel({ orders, orderTotals, onAdd, onDelete }) {
  const [form, setForm] = useState({ customer: '', reference: '', amount: '', date: todayISO() });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.customer.trim() || !form.reference.trim() || !Number(form.amount)) return;
    onAdd({ customer: form.customer.trim(), reference: form.reference.trim(), amount: Number(form.amount), date: form.date });
    setForm({ customer: '', reference: '', amount: '', date: todayISO() });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 14 }}>New order</div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Order reference">
            <input style={inputStyle} value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="e.g. VF-0231" />
          </Field>
          <Field label="Customer">
            <input style={inputStyle} value={form.customer} onChange={(e) => update('customer', e.target.value)} placeholder="e.g. Kaggwa Poultry Farm" />
          </Field>
          <Field label="Order value (UGX)">
            <input style={inputStyle} type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Order date">
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
          </Field>
          <button className="vf-btn" type="submit" style={{ background: COLORS.forest, color: '#fff', padding: '10px 14px', borderRadius: 7, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16} /> Add order
          </button>
        </form>
      </Card>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 12 }}>Orders on file</div>
        {orders.length === 0 ? (
          <EmptyState text="No orders yet. Add one to start matching payments against it." compact />
        ) : (
          <table>
            <thead>
              <tr><th>Reference</th><th>Customer</th><th>Value</th><th>Paid</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const paid = orderTotals[order.id] || 0;
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700 }}>{order.reference}</td>
                    <td>{order.customer}</td>
                    <td>{fmt(order.amount)}</td>
                    <td style={{ color: paid >= order.amount ? '#1F7A46' : COLORS.orangeDark, fontWeight: 600 }}>{fmt(paid)}</td>
                    <td><StatusBadge status={paid <= 0 ? 'unpaid' : paid < order.amount ? 'partial' : paid === order.amount ? 'paid' : 'over'} /></td>
                    <td>
                      <button className="vf-btn" onClick={() => onDelete(order.id)} style={{ background: 'transparent', color: COLORS.red, padding: 6 }} aria-label="Delete order">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function PaymentsPanel({ payments, orders, onDelete, onMatch }) {
  const [query, setQuery] = useState('');

  const filtered = payments.filter((payment) => {
    const search = query.toLowerCase();
    if (!search) return true;
    return payment.customer.toLowerCase().includes(search) || (payment.reference || '').toLowerCase().includes(search);
  });

  if (payments.length === 0) {
    return <EmptyState text="No payments recorded yet. Use “Record payment” to log the first one." />;
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, flex: 1 }}>All payments</div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: COLORS.sage }} />
          <input style={{ ...inputStyle, paddingLeft: 28, width: 200 }} placeholder="Search customer or ref" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Customer</th><th>Amount</th><th>Method</th><th>Reference</th><th>Matched order</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payment) => (
              <tr key={payment.id}>
                <td style={{ whiteSpace: 'nowrap', color: COLORS.sage }}>{payment.date}</td>
                <td style={{ fontWeight: 600 }}>{payment.customer}</td>
                <td style={{ fontWeight: 700 }}>{fmt(payment.amount)}</td>
                <td>{payment.method}</td>
                <td style={{ color: COLORS.sage }}>{payment.reference || '—'}</td>
                <td>
                  <select style={{ ...inputStyle, padding: '5px 6px', fontSize: 12.5, minWidth: 150 }} value={payment.orderId || ''} onChange={(e) => onMatch(payment.id, e.target.value)}>
                    <option value="">Unmatched</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>{order.reference} — {order.customer}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="vf-btn" onClick={() => onDelete(payment.id)} style={{ background: 'transparent', color: COLORS.red, padding: 6 }} aria-label="Delete payment">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ReconcilePanel({ orders, payments, orderTotals, orderStatus, unmatchedPayments, onMatch }) {
  const [pickingFor, setPickingFor] = useState(null);
  const openOrders = orders.filter((order) => orderStatus(order) !== 'paid');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>Needs reconciling</div>
        <div style={{ fontSize: 12, color: COLORS.sage, marginBottom: 12 }}>Payments not yet matched to an order</div>
        {unmatchedPayments.length === 0 ? (
          <EmptyState text="Everything is matched. Nice and tidy." compact />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unmatchedPayments.map((payment) => (
              <div key={payment.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{payment.customer}</div>
                  <div style={{ fontWeight: 700 }}>{fmt(payment.amount)}</div>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.sage, marginTop: 2 }}>{payment.date} · {payment.method} {payment.reference ? `· ${payment.reference}` : ''}</div>
                {pickingFor === payment.id ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <select autoFocus style={{ ...inputStyle, fontSize: 12.5, padding: '6px 8px' }} onChange={(e) => { if (e.target.value) { onMatch(payment.id, e.target.value); setPickingFor(null); } }} defaultValue="">
                      <option value="" disabled>Choose an order…</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>{order.reference} — {order.customer} — {fmt(order.amount)}</option>
                      ))}
                    </select>
                    <button className="vf-btn" onClick={() => setPickingFor(null)} style={{ background: '#EFEADA', color: COLORS.ink, borderRadius: 6, padding: '0 10px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button className="vf-btn" onClick={() => setPickingFor(payment.id)} style={{ marginTop: 8, background: COLORS.orange, color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Link2 size={13} /> Match to order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>Open orders</div>
        <div style={{ fontSize: 12, color: COLORS.sage, marginBottom: 12 }}>Orders that are unpaid or partially paid</div>
        {openOrders.length === 0 ? (
          <EmptyState text="No open balances. Every order on file is fully paid." compact />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {openOrders.map((order) => {
              const paid = orderTotals[order.id] || 0;
              const remaining = Math.max((Number(order.amount) || 0) - paid, 0);
              return (
                <div key={order.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{order.reference} — {order.customer}</div>
                    <StatusBadge status={orderStatus(order)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 6, color: COLORS.sage }}>
                    <span>Value {fmt(order.amount)}</span>
                    <span>Paid {fmt(paid)}</span>
                    <span style={{ color: COLORS.orangeDark, fontWeight: 700 }}>Due {fmt(remaining)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function FinanceLedger({ orders, payments, addPayment, addOrder, deletePayment, deleteOrder, matchPayment, orderTotals, orderStatus, unmatchedPayments, currentUser }) {
  const [tab, setTab] = useState('record');
  const totalReceived = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const totalOrdersValue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  const totalOutstanding = orders.reduce((sum, order) => {
    const paid = orderTotals[order.id] || 0;
    return sum + Math.max((Number(order.amount) || 0) - paid, 0);
  }, 0);

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${COLORS.line}` }}>
      <div style={{ background: COLORS.forest, padding: '18px 20px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BFD4C4' }}>Finance ledger</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{currentUser?.role === 'teller' ? 'Teller ledger entry' : 'Finance ledger desk'}</div>
          </div>
          <div style={{ fontSize: 12, color: '#DDEEDD' }}>{currentUser?.fullName || 'Admin'} logged in</div>
        </div>

        <div style={{ display: 'flex', gap: 1, marginTop: 18, background: COLORS.forestDark, borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
          <SummaryCell label="Total received" value={fmt(totalReceived)} />
          <SummaryCell label="Orders on file" value={fmt(totalOrdersValue)} />
          <SummaryCell label="Outstanding" value={fmt(totalOutstanding)} accent={totalOutstanding > 0 ? COLORS.orange : '#6FCF97'} />
          <SummaryCell label="Unmatched payments" value={unmatchedPayments.length} accent={unmatchedPayments.length > 0 ? COLORS.orange : '#6FCF97'} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 0, paddingTop: 14 }}>
          {['record', 'payments', 'orders', 'reconcile'].map((key) => (
            <div key={key} onClick={() => setTab(key)} style={{ cursor: 'pointer', padding: '9px 16px', fontSize: 13, fontWeight: 700, borderRadius: '8px 8px 0 0', background: tab === key ? COLORS.cream : 'transparent', color: tab === key ? COLORS.forest : '#D8E6DB', textTransform: 'capitalize' }}>
              {key === 'record' ? 'Record payment' : key === 'payments' ? `Payments (${payments.length})` : key === 'orders' ? `Orders (${orders.length})` : 'Reconcile'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {tab === 'record' && (
          <RecordPaymentPanel
            orders={orders}
            onAdd={(payment) => addPayment({
              ...payment,
              teller: currentUser?.id || 'admin',
              recordedBy: currentUser?.fullName || 'System Administrator',
              branch: currentUser?.branch || 'Head Office',
            })}
          />
        )}
        {tab === 'payments' && <PaymentsPanel payments={payments} orders={orders} onDelete={deletePayment} onMatch={matchPayment} />}
        {tab === 'orders' && <OrdersPanel orders={orders} orderTotals={orderTotals} onAdd={(order) => addOrder(order)} onDelete={deleteOrder} />}
        {tab === 'reconcile' && (
          <ReconcilePanel
            orders={orders}
            payments={payments}
            orderTotals={orderTotals}
            orderStatus={orderStatus}
            unmatchedPayments={unmatchedPayments}
            onMatch={matchPayment}
          />
        )}
      </div>
    </div>
  );
}

function ReportsPanel({ payments, orders, totalReceived, totalOutstanding, onExport }) {
  const totalOrders = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  const unmatched = payments.filter((payment) => !payment.orderId).length;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest }}>Excel report portal</div>
        <button onClick={onExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.forest, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
          <Download size={16} /> Download Excel report
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px,1fr))', gap: 12 }}>
        <MiniPanel label="Total received" value={fmt(totalReceived)} tone="forest" />
        <MiniPanel label="Total orders" value={fmt(totalOrders)} tone="sage" />
        <MiniPanel label="Outstanding" value={fmt(totalOutstanding)} tone="orange" />
        <MiniPanel label="Unmatched" value={String(unmatched)} tone="red" />
      </div>
      <div style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th><th>Reference</th></tr>
          </thead>
          <tbody>
            {payments.slice(0, 8).map((payment) => (
              <tr key={payment.id}>
                <td>{payment.customer}</td>
                <td>{fmt(payment.amount)}</td>
                <td>{payment.method}</td>
                <td>{payment.date}</td>
                <td>{payment.reference || '—'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="5"><EmptyState text="No report data available yet." compact /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AdminPortal({ orders, payments, tellers, setTellers, currentUser, onLogout, addPayment, addOrder, deletePayment, deleteOrder, matchPayment, orderTotals, orderStatus, unmatchedPayments, totalReceived, totalOutstanding, totalOrdersValue }) {
  const [tab, setTab] = useState('dashboard');
  const [newTeller, setNewTeller] = useState({ fullName: '', username: '', password: '', branch: 'Main Branch' });
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');

  function createTeller(e) {
    e.preventDefault();
    const fullName = newTeller.fullName.trim();
    const username = newTeller.username.trim();
    const password = newTeller.password.trim();

    if (!fullName || !username || !password) {
      setFormError('Please fill in the teller name, username and password.');
      return;
    }

    if (tellers.some((teller) => teller.username.toLowerCase() === username.toLowerCase())) {
      setFormError('That teller username already exists.');
      return;
    }

    const account = { id: uid(), username, password, fullName, role: 'teller', branch: newTeller.branch || 'Main Branch', status: 'active' };
    setTellers((previous) => [...previous, account]);
    setNewTeller({ fullName: '', username: '', password: '', branch: 'Main Branch' });
    setFormError('');
    setFormMessage(`Teller account created for ${fullName}. Login username: ${username}`);
  }

  function exportAdminReport() {
    exportCsv(payments);
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: COLORS.forest, color: '#fff', borderRadius: 16, padding: '18px 20px' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BFD4C4' }}>Admin portal</div>
            <div style={{ fontSize: 27, fontWeight: 800 }}>Welcome, {currentUser.fullName}</div>
          </div>
          <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: COLORS.forest, border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px,1fr))', gap: 12, marginTop: 18 }}>
          <MiniPanel label="Total received" value={fmt(totalReceived)} tone="forest" />
          <MiniPanel label="Outstanding" value={fmt(totalOutstanding)} tone="orange" />
          <MiniPanel label="Teller accounts" value={String(tellers.filter((teller) => teller.role === 'teller').length)} tone="sage" />
          <MiniPanel label="Unmatched" value={String(unmatchedPayments.length)} tone="red" />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
          {['dashboard', 'tellers', 'reports', 'ledger'].map((item) => (
            <button key={item} onClick={() => setTab(item)} style={{ border: 'none', borderRadius: 10, background: tab === item ? COLORS.forest : '#E9E2D1', color: tab === item ? '#fff' : COLORS.forest, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {tab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 10 }}>Portal control center</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                  <StatBox label="Orders on file" value={fmt(totalOrdersValue)} />
                  <StatBox label="Payments logged" value={String(payments.length)} />
                  <StatBox label="Active tellers" value={String(tellers.filter((teller) => teller.role === 'teller' && teller.status !== 'inactive').length)} />
                  <StatBox label="Open balances" value={fmt(totalOutstanding)} />
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 10 }}>Recent activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{payment.customer}</strong>
                        <span style={{ color: COLORS.orangeDark, fontWeight: 700 }}>{fmt(payment.amount)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.sage }}>{payment.date} · {payment.method}</div>
                    </div>
                  ))}
                  {payments.length === 0 && <EmptyState text="No payment activity recorded yet." compact />}
                </div>
              </Card>
            </div>
          )}

          {tab === 'tellers' && (
            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 12 }}>Create teller account</div>
                <form onSubmit={createTeller} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Full name">
                    <input value={newTeller.fullName} onChange={(e) => setNewTeller((previous) => ({ ...previous, fullName: e.target.value }))} style={inputStyle} placeholder="e.g. Jane Namuli" />
                  </Field>
                  <Field label="Username">
                    <input value={newTeller.username} onChange={(e) => setNewTeller((previous) => ({ ...previous, username: e.target.value }))} style={inputStyle} placeholder="e.g. teller3" />
                  </Field>
                  <Field label="Password">
                    <input value={newTeller.password} onChange={(e) => setNewTeller((previous) => ({ ...previous, password: e.target.value }))} type="password" style={inputStyle} placeholder="Create secure password" />
                  </Field>
                  <Field label="Branch">
                    <input value={newTeller.branch} onChange={(e) => setNewTeller((previous) => ({ ...previous, branch: e.target.value }))} style={inputStyle} placeholder="Main Branch" />
                  </Field>
                  {formError && <div style={{ color: COLORS.red, fontSize: 12, fontWeight: 700 }}>{formError}</div>}
                  {formMessage && <div style={{ color: '#1F7A46', fontSize: 12, fontWeight: 700 }}>{formMessage}</div>}
                  <button type="submit" style={{ background: COLORS.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px', fontWeight: 700, cursor: 'pointer' }}>Create teller</button>
                </form>
              </Card>

              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 12 }}>Teller accounts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tellers.filter((teller) => teller.role === 'teller').map((teller) => (
                    <div key={teller.id} style={{ border: '1px solid #E7DFD0', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{teller.fullName}</div>
                          <div style={{ fontSize: 12, color: COLORS.sage }}>{teller.branch}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, background: teller.status === 'active' ? '#E6F6EE' : '#FBE9E6', color: teller.status === 'active' ? '#1F7A46' : COLORS.red, borderRadius: 999, padding: '4px 8px' }}>{teller.status || 'active'}</div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: COLORS.ink }}><strong>Username:</strong> {teller.username}</div>
                      <div style={{ fontSize: 12, color: COLORS.ink }}><strong>Password:</strong> {teller.password}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'reports' && (
            <ReportsPanel payments={payments} orders={orders} totalReceived={totalReceived} totalOutstanding={totalOutstanding} onExport={exportAdminReport} />
          )}

          {tab === 'ledger' && (
            <FinanceLedger
              orders={orders}
              payments={payments}
              addPayment={addPayment}
              addOrder={addOrder}
              deletePayment={deletePayment}
              deleteOrder={deleteOrder}
              matchPayment={matchPayment}
              orderTotals={orderTotals}
              orderStatus={orderStatus}
              unmatchedPayments={unmatchedPayments}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TellerPortal({ orders, payments, currentUser, onLogout, addPayment, deletePayment, matchPayment, orderTotals, orderStatus, unmatchedPayments, totalReceived, totalOutstanding, totalOrdersValue }) {
  const [tab, setTab] = useState('dashboard');
  const tellerPayments = payments.filter((payment) => payment.recordedBy === currentUser.fullName || payment.teller === currentUser.id || payment.teller === currentUser.username);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ background: COLORS.forest, color: '#fff', borderRadius: 16, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BFD4C4' }}>Teller portal</div>
            <div style={{ fontSize: 27, fontWeight: 800 }}>Welcome, {currentUser.fullName}</div>
          </div>
          <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: COLORS.forest, border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px,1fr))', gap: 12, marginTop: 18 }}>
          <MiniPanel label="Today collection" value={fmt(totalReceived)} tone="forest" />
          <MiniPanel label="Orders value" value={fmt(totalOrdersValue)} tone="orange" />
          <MiniPanel label="Open balances" value={fmt(totalOutstanding)} tone="sage" />
          <MiniPanel label="My entries" value={String(tellerPayments.length)} tone="red" />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
          {['dashboard', 'transactions', 'reports', 'ledger'].map((item) => (
            <button key={item} onClick={() => setTab(item)} style={{ border: 'none', borderRadius: 10, background: tab === item ? COLORS.forest : '#E9E2D1', color: tab === item ? '#fff' : COLORS.forest, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {tab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 10 }}>Current desk summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                  <StatBox label="My entries" value={String(tellerPayments.length)} />
                  <StatBox label="Matched payments" value={String(tellerPayments.filter((p) => p.orderId).length)} />
                  <StatBox label="Awaiting match" value={String(tellerPayments.filter((p) => !p.orderId).length)} />
                  <StatBox label="Branch" value={currentUser.branch || 'Main Branch'} />
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 10 }}>Latest payments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tellerPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{payment.customer}</strong>
                        <span style={{ color: COLORS.orangeDark, fontWeight: 700 }}>{fmt(payment.amount)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.sage }}>{payment.date}</div>
                    </div>
                  ))}
                  {tellerPayments.length === 0 && <EmptyState text="You have not recorded any payment entries yet." compact />}
                </div>
              </Card>
            </div>
          )}

          {tab === 'transactions' && (
            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.forest, marginBottom: 12 }}>My transaction log</div>
              {tellerPayments.length === 0 ? (
                <EmptyState text="No teller transactions yet." compact />
              ) : (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Customer</th><th>Amount</th><th>Method</th><th>Reference</th></tr>
                  </thead>
                  <tbody>
                    {tellerPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.date}</td>
                        <td>{payment.customer}</td>
                        <td>{fmt(payment.amount)}</td>
                        <td>{payment.method}</td>
                        <td>{payment.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          {tab === 'reports' && (
            <ReportsPanel payments={payments} orders={orders} totalReceived={totalReceived} totalOutstanding={totalOutstanding} onExport={() => exportCsv(payments)} />
          )}

          {tab === 'ledger' && (
            <FinanceLedger
              orders={orders}
              payments={payments}
              addPayment={addPayment}
              deletePayment={deletePayment}
              matchPayment={matchPayment}
              orderTotals={orderTotals}
              orderStatus={orderStatus}
              unmatchedPayments={unmatchedPayments}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tellers, setTellers] = useState(() => loadTellers());
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    const data = loadLedgerData();
    setOrders(data.orders);
    setPayments(data.payments);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState('saving');
    const timer = setTimeout(() => {
      const ok = storage.set(LEDGER_KEY, { orders, payments });
      setSaveState(ok ? 'saved' : 'error');
    }, 300);
    return () => clearTimeout(timer);
  }, [orders, payments, loaded]);

  useEffect(() => {
    storage.set(TELLER_KEY, tellers);
  }, [tellers]);

  useEffect(() => {
    if (!currentUser) {
      storage.set(AUTH_KEY, null);
      return;
    }
    storage.set(AUTH_KEY, currentUser);
  }, [currentUser]);

  const orderTotals = useMemo(() => {
    const map = {};
    for (const order of orders) map[order.id] = 0;
    for (const payment of payments) {
      if (payment.orderId && map[payment.orderId] !== undefined) map[payment.orderId] += Number(payment.amount) || 0;
    }
    return map;
  }, [orders, payments]);

  function orderStatus(order) {
    const paid = orderTotals[order.id] || 0;
    const due = Number(order.amount) || 0;
    if (paid <= 0) return 'unpaid';
    if (paid < due) return 'partial';
    if (paid === due) return 'paid';
    return 'over';
  }

  const unmatchedPayments = payments.filter((payment) => !payment.orderId);
  const totalReceived = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const totalOutstanding = orders.reduce((sum, order) => {
    const paid = orderTotals[order.id] || 0;
    return sum + Math.max((Number(order.amount) || 0) - paid, 0);
  }, 0);
  const totalOrdersValue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);

  function addPayment(payment) {
    const newPayment = {
      ...payment,
      id: uid(),
      teller: payment.teller || currentUser?.id || 'admin',
      recordedBy: payment.recordedBy || currentUser?.fullName || 'System Administrator',
      branch: payment.branch || currentUser?.branch || 'Head Office',
    };
    setPayments((previous) => [newPayment, ...previous]);
  }

  function deletePayment(id) {
    setPayments((previous) => previous.filter((payment) => payment.id !== id));
  }

  function matchPayment(paymentId, orderId) {
    setPayments((previous) => previous.map((payment) => (payment.id === paymentId ? { ...payment, orderId: orderId || null } : payment)));
  }

  function addOrder(order) {
    setOrders((previous) => [{ ...order, id: uid(), createdBy: currentUser?.fullName || 'System Administrator' }, ...previous]);
  }

  function deleteOrder(id) {
    setOrders((previous) => previous.filter((order) => order.id !== id));
    setPayments((previous) => previous.map((payment) => (payment.orderId === id ? { ...payment, orderId: null } : payment)));
  }

  function handleLogin(username, password) {
    const normalized = String(username || '').trim();
    const typedPassword = String(password || '').trim();

    if (normalized === DEFAULT_ADMIN.username && typedPassword === DEFAULT_ADMIN.password) {
      setCurrentUser({ ...DEFAULT_ADMIN, password: DEFAULT_ADMIN.password });
      return true;
    }

    const foundTeller = tellers.find((user) => user.role === 'teller' && user.username === normalized && user.password === typedPassword);
    if (foundTeller) {
      setCurrentUser({ ...foundTeller, password: foundTeller.password });
      return true;
    }

    return false;
  }

  if (!loaded) {
    return (
      <div style={{ background: COLORS.cream, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui', color: COLORS.forest }}>
        Loading portal…
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} tellers={tellers} />;
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminPortal
        orders={orders}
        payments={payments}
        tellers={tellers}
        setTellers={setTellers}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        addPayment={addPayment}
        addOrder={addOrder}
        deletePayment={deletePayment}
        deleteOrder={deleteOrder}
        matchPayment={matchPayment}
        orderTotals={orderTotals}
        orderStatus={orderStatus}
        unmatchedPayments={unmatchedPayments}
        totalReceived={totalReceived}
        totalOutstanding={totalOutstanding}
        totalOrdersValue={totalOrdersValue}
      />
    );
  }

  return (
    <TellerPortal
      orders={orders}
      payments={payments}
      currentUser={currentUser}
      onLogout={() => setCurrentUser(null)}
      addPayment={addPayment}
      deletePayment={deletePayment}
      matchPayment={matchPayment}
      orderTotals={orderTotals}
      orderStatus={orderStatus}
      unmatchedPayments={unmatchedPayments}
      totalReceived={totalReceived}
      totalOutstanding={totalOutstanding}
      totalOrdersValue={totalOrdersValue}
    />
  );
}
