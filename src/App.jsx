import { useState, useEffect, useMemo } from "react";

const CATEGORIES = ["전체", "식비", "교통", "쇼핑", "문화", "의료", "기타"];
const CAT_COLORS = {
  식비: "#E85D4A",
  교통: "#3B82F6",
  쇼핑: "#8B5CF6",
  문화: "#10B981",
  의료: "#F59E0B",
  기타: "#6B7280",
};

const formatKRW = (n) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(n));

function CategoryBadge({ category }) {
  return (
    <span
      style={{
        background: CAT_COLORS[category] + "18",
        color: CAT_COLORS[category],
        fontSize: 12,
        padding: "2px 10px",
        borderRadius: 99,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {category}
    </span>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("budget_txns") || "[]");
    } catch {
      return [];
    }
  });

  const [filter, setFilter] = useState("전체");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "지출",
    amount: "",
    category: "식비",
    memo: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    localStorage.setItem("budget_txns", JSON.stringify(transactions));
  }, [transactions]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "수입")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "지출")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filtered = useMemo(() => {
    const list =
      filter === "전체"
        ? transactions
        : transactions.filter((t) => t.category === filter);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filter]);

  const handleSubmit = () => {
    const amt = parseInt(form.amount.replace(/,/g, ""), 10);
    if (!amt || isNaN(amt) || amt <= 0) return;
    if (editId !== null) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editId ? { ...t, ...form, amount: amt } : t
        )
      );
      setEditId(null);
    } else {
      setTransactions((prev) => [
        ...prev,
        { id: Date.now(), ...form, amount: amt },
      ]);
    }
    setForm({
      type: "지출",
      amount: "",
      category: "식비",
      memo: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(false);
  };

  const handleEdit = (t) => {
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      memo: t.memo,
      date: t.date,
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAmountInput = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setForm((f) => ({ ...f, amount: raw ? formatKRW(raw) : "" }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 헤더 */}
      <header style={{ background: "#111", color: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 0 0" }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", color: "#888", textTransform: "uppercase" }}>
            My Budget
          </p>
          <h1 style={{ margin: "4px 0 20px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
            가계부
          </h1>

          {/* 요약 카드 3개 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#222", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            {[
              { label: "수입", value: summary.income, color: "#10B981" },
              { label: "지출", value: summary.expense, color: "#E85D4A" },
              { label: "잔액", value: summary.balance, color: summary.balance >= 0 ? "#fff" : "#E85D4A" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "14px 16px", background: "#1A1A1A" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#666" }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>
                  ₩{formatKRW(s.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 24px 100px" }}>
        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 99,
                border: "1.5px solid",
                borderColor: filter === c ? "#111" : "#E0DDD8",
                background: filter === c ? "#111" : "#fff",
                color: filter === c ? "#fff" : "#555",
                fontSize: 13,
                fontWeight: filter === c ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 내역 리스트 */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#AAA" }}>
            
            <p style={{ margin: 0, fontSize: 14 }}>내역이 없어요. 아래 + 버튼으로 추가하세요.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid #F0EDE8",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: (CAT_COLORS[t.category] || "#888") + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {t.category === "식비" ? "🍽" : t.category === "교통" ? "🚌" : t.category === "쇼핑" ? "🛍" : t.category === "문화" ? "🎬" : t.category === "의료" ? "💊" : "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <CategoryBadge category={t.category} />
                    <span style={{ fontSize: 11, color: "#BBB" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.memo || "메모 없음"}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.type === "수입" ? "#10B981" : "#E85D4A", letterSpacing: "-0.02em" }}>
                    {t.type === "수입" ? "+" : "-"}₩{formatKRW(t.amount)}
                  </p>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                    <button onClick={() => handleEdit(t)} style={{ fontSize: 11, color: "#999", background: "none", border: "none", cursor: "pointer", padding: 0 }}>수정</button>
                    <button onClick={() => handleDelete(t.id)} style={{ fontSize: 11, color: "#E85D4A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 플로팅 추가 버튼 */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          style={{
            position: "fixed",
            bottom: 28,
            right: "calc(50% - 260px + 24px)",
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#111",
            color: "#fff",
            fontSize: 26,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="내역 추가"
        >
          +
        </button>
      )}

      {/* 입력 폼 패널 */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            padding: "24px 24px 40px",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {editId !== null ? "내역 수정" : "내역 추가"}
            </h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
          </div>

          {/* 수입/지출 토글 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["지출", "수입"].map((type) => (
              <button
                key={type}
                onClick={() => setForm((f) => ({ ...f, type }))}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "2px solid",
                  borderColor: form.type === type ? (type === "수입" ? "#10B981" : "#E85D4A") : "#EEE",
                  background: form.type === type ? (type === "수입" ? "#ECFDF5" : "#FEF2F2") : "#fff",
                  color: form.type === type ? (type === "수입" ? "#10B981" : "#E85D4A") : "#999",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* 금액 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>금액 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amount}
              onChange={handleAmountInput}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 20,
                fontWeight: 700,
                border: "1.5px solid #E5E5E5",
                borderRadius: 10,
                outline: "none",
                boxSizing: "border-box",
                letterSpacing: "-0.02em",
              }}
            />
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>카테고리</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.filter((c) => c !== "전체").map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    border: "1.5px solid",
                    borderColor: form.category === c ? CAT_COLORS[c] : "#E5E5E5",
                    background: form.category === c ? CAT_COLORS[c] + "18" : "#fff",
                    color: form.category === c ? CAT_COLORS[c] : "#888",
                    fontSize: 13,
                    fontWeight: form.category === c ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 + 메모 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", padding: "10px 10px", border: "1.5px solid #E5E5E5", borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>메모</label>
              <input
                type="text"
                placeholder="어디서 썼나요?"
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E5E5", borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none" }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {editId !== null ? "수정 완료" : "추가하기"}
          </button>
        </div>
      )}
    </div>
  );
}