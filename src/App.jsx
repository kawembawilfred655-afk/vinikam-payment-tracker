import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Link2, CheckCircle2, AlertCircle, Circle, X, Search } from 'lucide-react';

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
const STORAGE_KEY = 'vinikam-payments-v1';

const storage = {
  async get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? { value: fallback } : { value };
    } catch (error) {
      return { value: fallback };
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
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

export default function App() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('record');
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setOrders(data.orders || []);
          setPayments(data.payments || []);
        }
      } catch (e) {
        // no existing data yet, that's fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        const result = await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ orders, payments }),
          false
        );
        setSaveState(result ? 'saved' : 'error');
      } catch (e) {
        setSaveState('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [orders, payments, loaded]);

  const orderTotals = useMemo(() => {
    const map = {};
    for (const o of orders) map[o.id] = 0;
    for (const p of payments) {
      if (p.orderId && map[p.orderId] !== undefined) map[p.orderId] += Number(p.amount) || 0;
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

  const unmatchedPayments = payments.filter((p) => !p.orderId);
  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOutstanding = orders.reduce((s, o) => {
    const paid = orderTotals[o.id] || 0;
    const remaining = Math.max((Number(o.amount) || 0) - paid, 0);
    return s + remaining;
  }, 0);
  const totalOrdersValue = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  function addPayment(p) {
    setPayments((prev) => [{ ...p, id: uid() }, ...prev]);
  }
  function deletePayment(id) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }
  function matchPayment(paymentId, orderId) {
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, orderId: orderId || null } : p)));
  }
  function addOrder(o) {
    setOrders((prev) => [{ ...o, id: uid() }, ...prev]);
  }
  function deleteOrder(id) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setPayments((prev) => prev.map((p) => (p.orderId === id ? { ...p, orderId: null } : p)));
  }

  if (!loaded) {
    return (
      <div style={{ background: COLORS.cream, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui', color: COLORS.forest }}>
        Loading payment records…
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.cream, minHeight: '100%', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", color: COLORS.ink }}>
      <style>{`
        * { box-sizing: border-box; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${COLORS.orange}; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid ${COLORS.orange}; outline-offset: 2px; }
        ::placeholder { color: #A79E86; }
        .vf-btn { cursor: pointer; border: none; font-weight: 600; transition: transform .08s ease, background .15s ease; }
        .vf-btn:active { transform: scale(0.97); }
        .vf-tab { cursor: pointer; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 11px; letter-spacing: 0.02em; color: ${COLORS.sage}; font-weight: 600; padding: 8px 10px; border-bottom: 1.5px solid ${COLORS.line}; }
        td { padding: 10px 10px; border-bottom: 1px solid ${COLORS.line}; font-size: 13.5px; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
      `}</style>

      <div style={{ background: COLORS.forest, padding: '20px 20px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Vinikam Payment Ledger</div>
            <div style={{ fontSize: 12.5, color: '#BFD4C4', marginTop: 2 }}>Record payments, then reconcile them against orders</div>
          </div>
          <div style={{ fontSize: 11, color: saveState === 'error' ? '#F3B8AE' : '#BFD4C4', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: saveState === 'saving' ? COLORS.orange : saveState === 'error' ? COLORS.red : '#6FCF97', display: 'inline-block' }} />
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed — retrying next change' : 'Saved on this device'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 1, marginTop: 18, background: COLORS.forestDark, borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
          <SummaryCell label="Total received" value={fmt(totalReceived)} />
          <SummaryCell label="Orders on file" value={fmt(totalOrdersValue)} />
          <SummaryCell label="Outstanding" value={fmt(totalOutstanding)} accent={totalOutstanding > 0 ? COLORS.orange : '#6FCF97'} />
          <SummaryCell label="Unmatched payments" value={unmatchedPayments.length} accent={unmatchedPayments.length > 0 ? COLORS.orange : '#6FCF97'} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 0, paddingTop: 14 }}>
          {[
            ['record', 'Record payment'],
            ['payments', `Payments (${payments.length})`],
            ['orders', `Orders (${orders.length})`],
            ['reconcile', 'Reconcile'],
          ].map(([key, label]) => (
            <div
              key={key}
              className="vf-tab"
              onClick={() => setTab(key)}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: '8px 8px 0 0',
                background: tab === key ? COLORS.cream : 'transparent',
                color: tab === key ? COLORS.forest : '#D8E6DB',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 980, margin: '0 auto' }}>
        {tab === 'record' && <RecordPaymentPanel orders={orders} onAdd={addPayment} />}
        {tab === 'payments' && (
          <PaymentsPanel payments={payments} orders={orders} onDelete={deletePayment} onMatch={matchPayment} />
        )}
        {tab === 'orders' && <OrdersPanel orders={orders} orderTotals={orderTotals} onAdd={addOrder} onDelete={deleteOrder} />}
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

function SummaryCell({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: '10px 16px', background: COLORS.forest }}>
      <div style={{ fontSize: 10.5, color: '#9FBBA7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: accent || '#fff', marginTop: 2 }}>{value}</div>
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

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
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
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
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
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.reference} — {o.customer} — {fmt(o.amount)}</option>
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

function StatusBadge({ status }) {
  const map = {
    paid: { color: '#1F7A46', bg: '#E4F3EA', label: 'Fully paid', icon: CheckCircle2 },
    partial: { color: COLORS.orangeDark, bg: '#FBEBDA', label: 'Partial', icon: AlertCircle },
    unpaid: { color: '#8A8272', bg: '#EFEADA', label: 'Unpaid', icon: Circle },
    over: { color: COLORS.red, bg: '#FBE4E1', label: 'Overpaid', icon: AlertCircle },
  };
  const s = map[status] || map.unpaid;
  const Icon = s.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 20 }}>
      <Icon size={12} /> {s.label}
    </span>
  );
}

function PaymentsPanel({ payments, orders, onDelete, onMatch }) {
  const [query, setQuery] = useState('');
  const orderById = useMemo(() => Object.fromEntries(orders.map((o) => [o.id, o])), [orders]);

  const filtered = payments.filter((p) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return p.customer.toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q);
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
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ whiteSpace: 'nowrap', color: COLORS.sage }}>{p.date}</td>
                <td style={{ fontWeight: 600 }}>{p.customer}</td>
                <td style={{ fontWeight: 700 }}>{fmt(p.amount)}</td>
                <td>{p.method}</td>
                <td style={{ color: COLORS.sage }}>{p.reference || '—'}</td>
                <td>
                  <select
                    style={{ ...inputStyle, padding: '5px 6px', fontSize: 12.5, minWidth: 150 }}
                    value={p.orderId || ''}
                    onChange={(e) => onMatch(p.id, e.target.value)}
                  >
                    <option value="">Unmatched</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>{o.reference} — {o.customer}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="vf-btn" onClick={() => onDelete(p.id)} style={{ background: 'transparent', color: COLORS.red, padding: 6 }} aria-label="Delete payment">
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

function OrdersPanel({ orders, orderTotals, onAdd, onDelete }) {
  const [form, setForm] = useState({ customer: '', reference: '', amount: '', date: todayISO() });

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
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
              {orders.map((o) => {
                const paid = orderTotals[o.id] || 0;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>{o.reference}</td>
                    <td>{o.customer}</td>
                    <td>{fmt(o.amount)}</td>
                    <td style={{ color: paid >= o.amount ? '#1F7A46' : COLORS.orangeDark, fontWeight: 600 }}>{fmt(paid)}</td>
                    <td><StatusBadge status={paid <= 0 ? 'unpaid' : paid < o.amount ? 'partial' : paid === o.amount ? 'paid' : 'over'} /></td>
                    <td>
                      <button className="vf-btn" onClick={() => onDelete(o.id)} style={{ background: 'transparent', color: COLORS.red, padding: 6 }} aria-label="Delete order">
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

function ReconcilePanel({ orders, payments, orderTotals, orderStatus, unmatchedPayments, onMatch }) {
  const [pickingFor, setPickingFor] = useState(null);

  const openOrders = orders.filter((o) => orderStatus(o) !== 'paid');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>Needs reconciling</div>
        <div style={{ fontSize: 12, color: COLORS.sage, marginBottom: 12 }}>Payments not yet matched to an order</div>
        {unmatchedPayments.length === 0 ? (
          <EmptyState text="Everything is matched. Nice and tidy." compact />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unmatchedPayments.map((p) => (
              <div key={p.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.customer}</div>
                  <div style={{ fontWeight: 700 }}>{fmt(p.amount)}</div>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.sage, marginTop: 2 }}>{p.date} · {p.method} {p.reference ? `· ${p.reference}` : ''}</div>
                {pickingFor === p.id ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <select
                      autoFocus
                      style={{ ...inputStyle, fontSize: 12.5, padding: '6px 8px' }}
                      onChange={(e) => {
                        if (e.target.value) { onMatch(p.id, e.target.value); setPickingFor(null); }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose an order…</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>{o.reference} — {o.customer} — {fmt(o.amount)}</option>
                      ))}
                    </select>
                    <button className="vf-btn" onClick={() => setPickingFor(null)} style={{ background: '#EFEADA', color: COLORS.ink, borderRadius: 6, padding: '0 10px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="vf-btn"
                    onClick={() => setPickingFor(p.id)}
                    style={{ marginTop: 8, background: COLORS.orange, color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
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
            {openOrders.map((o) => {
              const paid = orderTotals[o.id] || 0;
              const remaining = Math.max((Number(o.amount) || 0) - paid, 0);
              return (
                <div key={o.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.reference} — {o.customer}</div>
                    <StatusBadge status={orderStatus(o)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 6, color: COLORS.sage }}>
                    <span>Value {fmt(o.amount)}</span>
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

function EmptyState({ text, compact }) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '20px 10px' : '50px 20px', color: COLORS.sage, fontSize: 13 }}>
      {text}
    </div>
  );
}
