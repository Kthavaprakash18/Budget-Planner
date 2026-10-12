"use strict";

/* ==================================
   FINORA - SMART BUDGET PLANNER
================================== */


/* ==================================
   1. CONSTANTS & CONFIGURATION
================================== */

const STORAGE_KEYS = {
    transactions:   "finora_transactions",
    budgets:        "finora_monthly_budgets",
    categoryBudgets:"finora_category_budgets",
    goals:          "finora_savings_goals",
    theme:          "finora_theme",
    user:           "finora_user"
};

const INCOME_CATEGORIES = [
    { id: "Salary",     icon: "fa-money-bill-wave",  label: "Salary" },
    { id: "Allowance",  icon: "fa-hand-holding-dollar", label: "Allowance" },
    { id: "Freelance",  icon: "fa-laptop",            label: "Freelance" },
    { id: "Business",   icon: "fa-briefcase",         label: "Business" },
    { id: "Investment", icon: "fa-chart-line",        label: "Investment" },
    { id: "Gift",       icon: "fa-gift",              label: "Gift" },
    { id: "Other",      icon: "fa-circle-dollar-to-slot", label: "Other" }
];

const EXPENSE_CATEGORIES = [
    { id: "Food",          icon: "fa-utensils",        label: "Food" },
    { id: "Transport",     icon: "fa-car",             label: "Transport" },
    { id: "Shopping",      icon: "fa-bag-shopping",    label: "Shopping" },
    { id: "Bills",         icon: "fa-file-invoice",    label: "Bills" },
    { id: "Health",        icon: "fa-heart-pulse",     label: "Health" },
    { id: "Entertainment", icon: "fa-film",            label: "Entertainment" },
    { id: "Education",     icon: "fa-graduation-cap",  label: "Education" },
    { id: "Other",         icon: "fa-circle-dollar-to-slot", label: "Other" }
];

const ALL_CATEGORIES = [
    ...INCOME_CATEGORIES,
    ...EXPENSE_CATEGORIES.filter(c => !INCOME_CATEGORIES.find(i => i.id === c.id))
];

const CATEGORY_ICON_MAP = {};
ALL_CATEGORIES.forEach(c => { CATEGORY_ICON_MAP[c.id] = c.icon; });
CATEGORY_ICON_MAP["Transfer"] = "fa-right-left";

const ACCOUNT_OPTIONS = [
    { id: "Cash", icon: "fa-money-bill-wave" },
    { id: "Card", icon: "fa-credit-card" },
    { id: "Bank", icon: "fa-building-columns" }
];

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];


/* ==================================
   2. STORAGE HELPERS
================================== */

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        console.error("Storage read failed:", key, e);
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error("Storage write failed:", key, e);
        showToast("Unable to save data. Check your browser storage.", "error");
        return false;
    }
}


/* ==================================
   3. LOGIN / ONBOARDING
================================== */

let simulatedOtp   = "";
let loginMethod    = "gmail";
let verifiedContact = "";

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function showLoginStep(stepId) {
    $$(".login-step").forEach(s => s.classList.add("hidden"));
    const t = document.getElementById(stepId);
    if (t) t.classList.remove("hidden");
}

function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function clearErrors() {
    $$(".input-error").forEach(el => (el.textContent = ""));
}

function initOtpInputs() {
    const boxes = $$(".otp-box");
    boxes.forEach((box, i) => {
        box.addEventListener("input", () => {
            box.value = box.value.replace(/\D/g, "").slice(-1);
            box.classList.toggle("filled", box.value !== "");
            if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
        });
        box.addEventListener("keydown", e => {
            if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
        });
        box.addEventListener("paste", e => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData)
                .getData("text").replace(/\D/g, "").slice(0, 6);
            pasted.split("").forEach((ch, j) => {
                if (boxes[j]) { boxes[j].value = ch; boxes[j].classList.add("filled"); }
            });
            boxes[Math.min(pasted.length, boxes.length - 1)].focus();
        });
    });
}

function getOtpValue() {
    return $$(".otp-box").map(b => b.value).join("");
}

function resetOtpBoxes() {
    $$(".otp-box").forEach(b => { b.value = ""; b.classList.remove("filled"); });
}

function sendOtp(contact, method) {
    simulatedOtp   = generateOtp();
    loginMethod    = method;
    verifiedContact = contact;
    document.getElementById("otpSubText").textContent =
        method === "gmail" ? `OTP sent to ${contact}` : `OTP sent to +91 ${contact}`;
    document.getElementById("simulatedOtpText").textContent = `Demo OTP: ${simulatedOtp}`;
    resetOtpBoxes();
    clearErrors();
    showLoginStep("loginStep3");
    setTimeout(() => { const b = $(".otp-box"); if (b) b.focus(); }, 100);
}

// Gmail
document.getElementById("gmailLoginBtn").addEventListener("click", () => {
    clearErrors(); showLoginStep("loginStep2Gmail");
    setTimeout(() => document.getElementById("gmailInput").focus(), 100);
});
document.getElementById("backFromGmail").addEventListener("click", () => {
    clearErrors(); showLoginStep("loginStep1");
});
document.getElementById("sendGmailOtpBtn").addEventListener("click", () => {
    const email = document.getElementById("gmailInput").value.trim();
    clearErrors();
    if (!email) { setError("gmailError", "Please enter your Gmail address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("gmailError", "Enter a valid email address."); return; }
    if (!email.toLowerCase().endsWith("@gmail.com")) { setError("gmailError", "Please use a Gmail address (@gmail.com)."); return; }
    sendOtp(email, "gmail");
});

// Phone
document.getElementById("phoneLoginBtn").addEventListener("click", () => {
    clearErrors(); showLoginStep("loginStep2Phone");
    setTimeout(() => document.getElementById("phoneInput").focus(), 100);
});
document.getElementById("backFromPhone").addEventListener("click", () => {
    clearErrors(); showLoginStep("loginStep1");
});
document.getElementById("sendPhoneOtpBtn").addEventListener("click", () => {
    const phone = document.getElementById("phoneInput").value.trim().replace(/\s/g, "");
    clearErrors();
    if (!phone) { setError("phoneError", "Please enter your phone number."); return; }
    if (!/^\d{10}$/.test(phone)) { setError("phoneError", "Enter a valid 10-digit mobile number."); return; }
    sendOtp(phone, "phone");
});

// OTP
document.getElementById("backFromOtp").addEventListener("click", () => {
    clearErrors();
    showLoginStep(loginMethod === "gmail" ? "loginStep2Gmail" : "loginStep2Phone");
});
document.getElementById("verifyOtpBtn").addEventListener("click", () => {
    const entered = getOtpValue();
    clearErrors();
    if (entered.length < 6) { setError("otpError", "Enter all 6 digits."); return; }
    if (entered !== simulatedOtp) {
        setError("otpError", "Incorrect OTP. Please try again.");
        resetOtpBoxes();
        const b = $(".otp-box"); if (b) b.focus();
        return;
    }
    clearErrors();
    showLoginStep("loginStep4");
    setTimeout(() => document.getElementById("userNameInput").focus(), 100);
});
document.getElementById("resendOtpBtn").addEventListener("click", () => {
    clearErrors();
    simulatedOtp = generateOtp();
    document.getElementById("simulatedOtpText").textContent = `Demo OTP: ${simulatedOtp}`;
    resetOtpBoxes();
    const b = $(".otp-box"); if (b) b.focus();
    showToast("A new OTP has been generated.");
});

// Name
document.getElementById("startAppBtn").addEventListener("click", () => {
    const name = document.getElementById("userNameInput").value.trim();
    clearErrors();
    if (!name) { setError("nameError", "Please enter your name to get started."); return; }
    if (name.length < 2) { setError("nameError", "Name must be at least 2 characters."); return; }
    const userData = { name: name.slice(0, 50), contact: verifiedContact, method: loginMethod };
    // Use sessionStorage so session clears on every page refresh/close
    try { sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData)); } catch(e) {}
    launchApp(userData);
});

function checkExistingSession() {
    // sessionStorage clears on refresh — so user must always re-login after refresh
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.user);
        if (raw) {
            const userData = JSON.parse(raw);
            if (userData && userData.name) { launchApp(userData); return true; }
        }
    } catch(e) {}
    return false;
}

function launchApp(userData) {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appContainer").style.display = "";

    // Show calculator FAB only after login
    const fab = document.getElementById("calcFab");
    if (fab) fab.style.display = "grid";

    document.getElementById("sidebarName").textContent = userData.name;
    document.getElementById("sidebarAvatar").textContent = userData.name.charAt(0).toUpperCase();
    document.getElementById("sidebarContact").textContent =
        userData.method === "phone" ? "+91 " + userData.contact : userData.contact;

    const welcomeEl = document.getElementById("welcomeMessage");
    if (welcomeEl) welcomeEl.textContent = `Hello, ${userData.name}! Make every rupee count.`;

    initializeApp();
}

// Logout
document.getElementById("logoutButton").addEventListener("click", () => {
    if (!confirm("Are you sure you want to logout?")) return;
    try { sessionStorage.removeItem(STORAGE_KEYS.user); } catch (e) {}
    // Hide calculator FAB and widget on logout
    const calcFabEl = document.getElementById("calcFab");
    const calcWidgetEl = document.getElementById("calculatorWidget");
    if (calcFabEl) calcFabEl.style.display = "none";
    if (calcWidgetEl) calcWidgetEl.style.display = "none";
    document.getElementById("appContainer").style.display = "none";
    document.getElementById("loginScreen").style.display = "";
    document.getElementById("gmailInput").value = "";
    document.getElementById("phoneInput").value = "";
    resetOtpBoxes();
    clearErrors();
    showLoginStep("loginStep1");
    simulatedOtp = ""; verifiedContact = "";
});


/* ==================================
   4. APPLICATION STATE
================================== */

let transactions   = readStorage(STORAGE_KEYS.transactions, []);
let budgets        = readStorage(STORAGE_KEYS.budgets, {});
let categoryBudgets = readStorage(STORAGE_KEYS.categoryBudgets, {});
let goals          = readStorage(STORAGE_KEYS.goals, []);

let selectedMonth  = getCurrentMonth();
let incomeExpenseChart = null;
let categoryChart  = null;
let trendChart     = null;
let editingTransactionId = null;
let editingGoalId  = null;
let notifications  = [];
let currentPage    = "dashboard";

// Transaction modal state
let currentTxnTab  = "income";  // "income" | "expense" | "transfer"


/* ==================================
   5. VALIDATION
================================== */

function validAmount(value, allowZero = false) {
    const n = Number(value);
    if (!Number.isFinite(n)) return false;
    return allowZero ? (n >= 0 && n <= 1e9) : (n > 0 && n <= 1e9);
}

function validDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const [y, m, d] = String(value).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return !Number.isNaN(date.getTime()) &&
        date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function normalizeData() {
    if (!Array.isArray(transactions)) transactions = [];
    transactions = transactions.filter(t =>
        t && t.id !== undefined &&
        ["income","expense","transfer"].includes(t.type) &&
        validAmount(t.amount) &&
        typeof t.category === "string" &&
        validDateString(t.date)
    ).map(t => ({
        ...t,
        amount: toPaise(t.amount) / 100,
        description: String(t.description || "").slice(0, 100),
        account: String(t.account || "Cash"),
        fromAccount: String(t.fromAccount || ""),
        toAccount: String(t.toAccount || "")
    }));

    if (!budgets || typeof budgets !== "object" || Array.isArray(budgets)) budgets = {};
    if (!categoryBudgets || typeof categoryBudgets !== "object" || Array.isArray(categoryBudgets)) categoryBudgets = {};
    if (!Array.isArray(goals)) goals = [];

    goals = goals.filter(g =>
        g && g.id !== undefined &&
        typeof g.name === "string" &&
        validAmount(g.target) &&
        validAmount(g.saved, true)
    ).map(g => ({
        ...g,
        target: toPaise(g.target) / 100,
        saved: toPaise(g.saved) / 100
    }));

    Object.keys(budgets).forEach(m => {
        if (!/^\d{4}-\d{2}$/.test(m) || !validAmount(budgets[m], true)) delete budgets[m];
        else budgets[m] = toPaise(budgets[m]) / 100;
    });

    saveAllData();
}


/* ==================================
   6. HELPERS
================================== */

function toPaise(v) { return Math.round(Number(v) * 100); }

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR",
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(toPaise(value || 0) / 100);
}

function getCurrentMonth() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
}

function getToday() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function formatDate(ds) {
    return new Intl.DateTimeFormat("en-IN",{ day:"numeric", month:"short", year:"numeric" })
        .format(new Date(ds + "T00:00:00"));
}

function formatMonth(ms) {
    const [y, m] = ms.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN",{ month:"long", year:"numeric" })
        .format(new Date(y, m-1, 1));
}

function escapeHTML(v) {
    return String(v ?? "").replace(/[&<>"']/g, c =>
        ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

function makeId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function")
        return globalThis.crypto.randomUUID();
    return Date.now() + "-" + Math.random().toString(36).slice(2);
}

function saveAllData() {
    writeStorage(STORAGE_KEYS.transactions, transactions);
    writeStorage(STORAGE_KEYS.budgets, budgets);
    writeStorage(STORAGE_KEYS.categoryBudgets, categoryBudgets);
    writeStorage(STORAGE_KEYS.goals, goals);
}


/* ==================================
   7. MONTHLY CALCULATIONS
================================== */

function getMonthTransactions(month = selectedMonth) {
    return transactions.filter(t => t.date.startsWith(month));
}

function getMonthStats(month = selectedMonth) {
    const items = getMonthTransactions(month);
    const income   = items.filter(t => t.type === "income").reduce((s,t) => s + toPaise(t.amount), 0);
    const expenses = items.filter(t => t.type === "expense").reduce((s,t) => s + toPaise(t.amount), 0);
    return {
        income: income / 100,
        expenses: expenses / 100,
        savings: (income - expenses) / 100,
        count: items.length
    };
}

function getMonthlyBudget(month = selectedMonth) { return Number(budgets[month] || 0); }

function getCategoryExpenses(month = selectedMonth) {
    const res = {};
    getMonthTransactions(month).filter(t => t.type === "expense").forEach(t => {
        res[t.category] = (res[t.category] || 0) + toPaise(t.amount) / 100;
    });
    return res;
}


/* ==================================
   8. TOAST
================================== */

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (type === "error" ? " error" : "");
    const icon = document.createElement("i");
    icon.className = type === "error" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(icon, text);
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}


/* ==================================
   9. MODALS
================================== */

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("open");
    const first = modal.querySelector("input:not([type=hidden]):not([type=radio]), select, textarea");
    if (first) setTimeout(() => first.focus(), 100);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("open");
}

function bindModalClosers() {
    $$("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
    $$(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", e => {
            if (e.target === overlay) overlay.classList.remove("open");
        });
    });
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        $$(".modal-overlay.open").forEach(m => m.classList.remove("open"));
        const np = document.getElementById("notificationPanel");
        if (np) np.classList.remove("open");
    }
});


/* ==================================
   10. NAVIGATION
================================== */

const pageTitles = {
    dashboard:"Dashboard", transactions:"Transactions", budgets:"Budgets",
    goals:"Savings Goals", analytics:"Analytics", reports:"Reports"
};

function navigateTo(page) {
    if (!pageTitles[page]) return;
    currentPage = page;
    $$(".page").forEach(s => s.classList.toggle("active", s.id === page));
    $$(".nav-link[data-page]").forEach(l => l.classList.toggle("active", l.dataset.page === page));
    const pt = document.getElementById("pageTitle");
    if (pt) pt.textContent = pageTitles[page];
    const sb = document.getElementById("sidebar"); if (sb) sb.classList.remove("open");
    const np = document.getElementById("notificationPanel"); if (np) np.classList.remove("open");
    if (location.hash !== "#" + page) history.replaceState(null, "", "#" + page);
    if (page === "analytics") updateAnalytics();
    if (page === "reports")   updateReports();
    if (page === "goals")     renderGoals();
    if (page === "budgets")   updateBudgetPage();
}

function bindNavigation() {
    $$(".nav-link[data-page]").forEach(link => {
        link.addEventListener("click", e => { e.preventDefault(); navigateTo(link.dataset.page); });
    });
    $$("[data-goto]").forEach(btn => {
        btn.addEventListener("click", () => navigateTo(btn.dataset.goto));
    });
    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const sb = document.getElementById("sidebar");
            if (sb) sb.classList.toggle("open");
        });
    }
}


/* ==================================
   11. MONTH PICKER
================================== */

function initMonthPicker() {
    const picker = document.getElementById("monthPicker");
    if (!picker) return;
    picker.value = selectedMonth;
    const todayEl = document.getElementById("todayDate");
    if (todayEl) {
        todayEl.textContent = new Intl.DateTimeFormat("en-IN",{
            weekday:"long", day:"numeric", month:"long", year:"numeric"
        }).format(new Date());
    }
    picker.addEventListener("change", e => {
        const v = e.target.value;
        if (!/^\d{4}-\d{2}$/.test(v)) { e.target.value = selectedMonth; return; }
        selectedMonth = v;
        renderAll();
        showToast("Showing data for " + formatMonth(selectedMonth));
    });
}


/* ==================================
   12. NEW TRANSACTION MODAL
================================== */

function getCategoriesForTab(tab) {
    return tab === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function renderCategoryChips(tab) {
    const grid = document.getElementById("categoryChipGrid");
    if (!grid) return;
    const cats = getCategoriesForTab(tab);
    const defaultCat = cats[0].id;

    grid.innerHTML = cats.map(c => `
        <button type="button" class="cat-chip${c.id === defaultCat ? " active" : ""}"
                data-cat="${escapeHTML(c.id)}">
            <i class="fa-solid ${c.icon}"></i>
            <span>${escapeHTML(c.label)}</span>
        </button>
    `).join("");

    const hiddenCat = document.getElementById("selectedCategory");
    if (hiddenCat) hiddenCat.value = defaultCat;

    grid.querySelectorAll(".cat-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            grid.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            if (hiddenCat) hiddenCat.value = chip.dataset.cat;
        });
    });
}

function switchTxnTab(tab) {
    currentTxnTab = tab;
    const hiddenType = document.getElementById("hiddenTxnType");
    if (hiddenType) hiddenType.value = tab;

    // Highlight active tab
    $$(".txn-type-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.txnTab === tab);
    });

    // Update amount section accent color
    const amtSection = document.getElementById("amountSection");
    if (amtSection) {
        amtSection.className = "txn-amount-section txn-amt-" + tab;
    }

    const ieFields = document.getElementById("incomeExpenseFields");
    const tfFields = document.getElementById("transferFields");

    if (tab === "transfer") {
        if (ieFields) ieFields.style.display = "none";
        if (tfFields) tfFields.style.display = "";
    } else {
        if (ieFields) ieFields.style.display = "";
        if (tfFields) tfFields.style.display = "none";
        renderCategoryChips(tab);
    }
}

function bindAccountChips(rowId, hiddenId, dataAttr) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.querySelectorAll(".account-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            row.querySelectorAll(".account-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const hidden = document.getElementById(hiddenId);
            if (hidden) hidden.value = chip.dataset[dataAttr];
        });
    });
}

function openTransactionModal(transaction = null) {
    const form = document.getElementById("transactionForm");
    if (form) form.reset();

    editingTransactionId = transaction ? transaction.id : null;

    document.getElementById("transactionId").value = transaction ? transaction.id : "";
    document.getElementById("transactionModalTitle").textContent =
        transaction ? "Edit Transaction" : "Add Transaction";

    // Determine tab
    const tab = transaction ? transaction.type : "income";
    switchTxnTab(tab);

    // Set amount
    document.getElementById("transactionAmount").value = transaction ? transaction.amount : "";

    // Set date
    document.getElementById("transactionDate").value = transaction ? transaction.date : getToday();

    // Set note
    document.getElementById("transactionDescription").value = transaction ? (transaction.description || "") : "";

    if (transaction && tab !== "transfer") {
        // Pre-select category chip
        setTimeout(() => {
            const grid = document.getElementById("categoryChipGrid");
            if (grid) {
                grid.querySelectorAll(".cat-chip").forEach(chip => {
                    const isActive = chip.dataset.cat === transaction.category;
                    chip.classList.toggle("active", isActive);
                });
                const hiddenCat = document.getElementById("selectedCategory");
                if (hiddenCat) hiddenCat.value = transaction.category;
            }

            // Pre-select account
            const row = document.getElementById("accountChipRow");
            if (row) {
                row.querySelectorAll(".account-chip").forEach(chip => {
                    chip.classList.toggle("active", chip.dataset.account === (transaction.account || "Cash"));
                });
                const hiddenAcc = document.getElementById("selectedAccount");
                if (hiddenAcc) hiddenAcc.value = transaction.account || "Cash";
            }
        }, 0);
    }

    if (transaction && tab === "transfer") {
        setTimeout(() => {
            const fromRow = document.getElementById("fromAccountChipRow");
            if (fromRow) {
                fromRow.querySelectorAll(".account-chip").forEach(chip => {
                    chip.classList.toggle("active", chip.dataset.from === (transaction.fromAccount || "Cash"));
                });
                const hiddenFrom = document.getElementById("selectedFromAccount");
                if (hiddenFrom) hiddenFrom.value = transaction.fromAccount || "Cash";
            }
            const toRow = document.getElementById("toAccountChipRow");
            if (toRow) {
                toRow.querySelectorAll(".account-chip").forEach(chip => {
                    chip.classList.toggle("active", chip.dataset.to === (transaction.toAccount || "Card"));
                });
                const hiddenTo = document.getElementById("selectedToAccount");
                if (hiddenTo) hiddenTo.value = transaction.toAccount || "Card";
            }
        }, 0);
    }

    openModal("transactionModal");
}

function bindTransactionButtons() {
    const addBtn = document.getElementById("addTransactionButton");
    if (addBtn) addBtn.addEventListener("click", () => openTransactionModal());

    const pageAddBtn = document.getElementById("transactionPageAdd");
    if (pageAddBtn) pageAddBtn.addEventListener("click", () => openTransactionModal());

    // Tab switching
    $$(".txn-type-tab").forEach(btn => {
        btn.addEventListener("click", () => switchTxnTab(btn.dataset.txnTab));
    });

    // Account chip bindings
    bindAccountChips("accountChipRow",   "selectedAccount",     "account");
    bindAccountChips("fromAccountChipRow","selectedFromAccount", "from");
    bindAccountChips("toAccountChipRow",  "selectedToAccount",   "to");
}


/* ==================================
   13. SAVE TRANSACTION
================================== */

function bindTransactionForm() {
    const form = document.getElementById("transactionForm");
    if (!form) return;

    form.addEventListener("submit", e => {
        e.preventDefault();

        const type   = document.getElementById("hiddenTxnType").value;
        const amount = Number(document.getElementById("transactionAmount").value);
        const date   = document.getElementById("transactionDate").value;
        const note   = document.getElementById("transactionDescription").value.trim();

        if (!validAmount(amount)) {
            showToast("Enter a valid positive amount.", "error"); return;
        }
        if (!validDateString(date)) {
            showToast("Please select a valid date.", "error"); return;
        }

        let transaction;

        if (type === "transfer") {
            const fromAcc = document.getElementById("selectedFromAccount").value || "Cash";
            const toAcc   = document.getElementById("selectedToAccount").value || "Card";

            if (fromAcc === toAcc) {
                showToast("From and To accounts must be different.", "error"); return;
            }

            transaction = {
                id: editingTransactionId || makeId(),
                type: "transfer",
                amount: toPaise(amount) / 100,
                category: "Transfer",
                date,
                description: note,
                account: fromAcc,
                fromAccount: fromAcc,
                toAccount: toAcc
            };

        } else {
            const category = document.getElementById("selectedCategory").value;
            const account  = document.getElementById("selectedAccount").value || "Cash";

            const validCats = getCategoriesForTab(type).map(c => c.id);
            if (!category || !validCats.includes(category)) {
                showToast("Please select a category.", "error"); return;
            }

            transaction = {
                id: editingTransactionId || makeId(),
                type,
                amount: toPaise(amount) / 100,
                category,
                date,
                description: note,
                account,
                fromAccount: "",
                toAccount: ""
            };
        }

        const prev = [...transactions];

        if (editingTransactionId !== null) {
            const idx = transactions.findIndex(t => String(t.id) === String(editingTransactionId));
            if (idx === -1) { showToast("Transaction not found.", "error"); return; }
            transactions[idx] = transaction;
        } else {
            transactions.push(transaction);
        }

        if (!writeStorage(STORAGE_KEYS.transactions, transactions)) {
            transactions = prev; return;
        }

        closeModal("transactionModal");
        renderAll();
        showToast(editingTransactionId !== null ? "Transaction updated." : "Transaction added.");
        editingTransactionId = null;
    });
}


/* ==================================
   14. DELETE TRANSACTION
================================== */

function deleteTransaction(id) {
    const txn = transactions.find(t => String(t.id) === String(id));
    if (!txn) { showToast("Transaction not found.", "error"); return; }
    if (!confirm("Delete this transaction permanently?")) return;
    const prev = [...transactions];
    transactions = transactions.filter(t => String(t.id) !== String(id));
    if (!writeStorage(STORAGE_KEYS.transactions, transactions)) { transactions = prev; return; }
    renderAll();
    showToast("Transaction deleted.");
}


/* ==================================
   15. TRANSACTION TABLES
================================== */

function categoryIconFor(cat) {
    return CATEGORY_ICON_MAP[cat] || "fa-circle-dollar-to-slot";
}

function transactionRow(txn, recent = false) {
    const isIncome   = txn.type === "income";
    const isTransfer = txn.type === "transfer";
    const icon = categoryIconFor(txn.category);
    const description = txn.description || txn.category;
    const amountPrefix = isIncome ? "+" : isTransfer ? "" : "−";
    const iconClass = isIncome ? "" : isTransfer ? "transfer" : "expense";

    const subLabel = isTransfer
        ? `${txn.fromAccount || "Cash"} → ${txn.toAccount || "Card"}`
        : (txn.account || "Cash");

    return `
        <tr>
            <td>
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div>
                        <div class="transaction-name">${escapeHTML(description)}</div>
                        <div class="transaction-method">${escapeHTML(subLabel)}</div>
                    </div>
                </div>
            </td>
            <td><span class="category-badge">${escapeHTML(txn.category)}</span></td>
            <td>${formatDate(txn.date)}</td>
            ${recent ? "" : `<td><span class="category-badge">${
                isIncome ? "Income" : isTransfer ? "Transfer" : "Expense"
            }</span></td>`}
            <td>
                <span class="amount ${txn.type}">
                    ${amountPrefix}${money(txn.amount)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-button" data-action="edit"
                            data-id="${escapeHTML(txn.id)}" aria-label="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-button delete" data-action="delete"
                            data-id="${escapeHTML(txn.id)}" aria-label="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function emptyTable(cols, msg) {
    return `<tr><td colspan="${cols}">
        <div class="empty-table">
            <i class="fa-solid fa-receipt"></i>${escapeHTML(msg)}
        </div></td></tr>`;
}

function renderRecentTransactions() {
    const items = getMonthTransactions()
        .sort((a,b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
        .slice(0, 5);
    const tb = document.getElementById("recentTransactions");
    if (tb) tb.innerHTML = items.length
        ? items.map(t => transactionRow(t, true)).join("")
        : emptyTable(5, "No transactions this month. Add your first transaction.");
}

function renderAllTransactions() {
    const query    = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const type     = document.getElementById("typeFilter")?.value || "all";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const sort     = document.getElementById("sortFilter")?.value || "newest";

    let items = getMonthTransactions().filter(t => {
        const text = [t.description, t.category, t.account, t.type, t.fromAccount, t.toAccount]
            .join(" ").toLowerCase();
        return text.includes(query)
            && (type === "all" || t.type === type)
            && (category === "all" || t.category === category);
    });

    if (sort === "newest")  items.sort((a,b) => b.date.localeCompare(a.date));
    if (sort === "oldest")  items.sort((a,b) => a.date.localeCompare(b.date));
    if (sort === "highest") items.sort((a,b) => toPaise(b.amount) - toPaise(a.amount));
    if (sort === "lowest")  items.sort((a,b) => toPaise(a.amount) - toPaise(b.amount));

    const tb = document.getElementById("allTransactions");
    if (tb) tb.innerHTML = items.length
        ? items.map(t => transactionRow(t)).join("")
        : emptyTable(6, "No matching transactions found.");

    const cnt = document.getElementById("transactionCount");
    if (cnt) cnt.textContent = `${items.length} transaction${items.length === 1 ? "" : "s"} found`;
}

function populateCategoryFilter() {
    const sel = document.getElementById("categoryFilter");
    if (!sel) return;
    const prev = sel.value;
    const cats = [...new Set(getMonthTransactions().map(t => t.category))].sort();
    sel.innerHTML = `<option value="all">All Categories</option>` +
        cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    if (cats.includes(prev)) sel.value = prev;
}

function handleTransactionAction(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "edit") {
        const txn = transactions.find(t => String(t.id) === String(btn.dataset.id));
        if (txn) openTransactionModal(txn);
    }
    if (btn.dataset.action === "delete") deleteTransaction(btn.dataset.id);
}

function bindTransactionFilters() {
    ["searchInput","typeFilter","categoryFilter","sortFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", renderAllTransactions);
    });
    document.getElementById("allTransactions")?.addEventListener("click", handleTransactionAction);
    document.getElementById("recentTransactions")?.addEventListener("click", handleTransactionAction);
}


/* ==================================
   16. DASHBOARD SUMMARY
================================== */

function updateSummary() {
    const stats = getMonthStats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("totalBalance",       money(stats.savings));
    set("totalIncome",        money(stats.income));
    set("totalExpenses",      money(stats.expenses));
    set("totalSavings",       money(stats.savings));
    set("analyticsIncome",    money(stats.income));
    set("analyticsExpenses",  money(stats.expenses));
    set("analyticsCount",     stats.count);
    const rate = stats.income > 0 ? (stats.savings / stats.income * 100) : 0;
    set("analyticsSavingsRate", rate.toFixed(1) + "%");
}


/* ==================================
   17. BUDGET MANAGEMENT
================================== */

function openBudgetModal() {
    const inp = document.getElementById("monthlyBudgetInput");
    if (inp) inp.value = getMonthlyBudget() || "";
    openModal("budgetModal");
}

function bindBudgetButtons() {
    document.getElementById("editBudgetButton")?.addEventListener("click", openBudgetModal);
    document.getElementById("budgetPageEdit")?.addEventListener("click", openBudgetModal);

    document.getElementById("budgetForm")?.addEventListener("submit", e => {
        e.preventDefault();
        const amount = Number(document.getElementById("monthlyBudgetInput").value);
        if (!validAmount(amount, true)) { showToast("Enter a valid budget amount.", "error"); return; }
        const prev = { ...budgets };
        budgets[selectedMonth] = toPaise(amount) / 100;
        if (!writeStorage(STORAGE_KEYS.budgets, budgets)) { budgets = prev; return; }
        closeModal("budgetModal");
        renderAll();
        showToast("Monthly budget saved.");
    });
}

function updateBudget() {
    const stats = getMonthStats();
    const budget = getMonthlyBudget();
    const spent  = stats.expenses;
    const pct    = budget > 0 ? spent / budget * 100 : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("budgetSpent",      money(spent));
    set("budgetLimit",      money(budget));
    set("budgetPercentage", pct.toFixed(1) + "% used");
    set("budgetRemaining",  budget > 0
        ? (budget - spent >= 0 ? money(budget-spent)+" remaining" : money(spent-budget)+" over budget")
        : "Set a budget to get started");

    const prog = document.getElementById("budgetProgress");
    if (prog) {
        prog.style.width = Math.min(pct, 100) + "%";
        prog.classList.toggle("warning", pct >= 80 && pct < 100);
        prog.classList.toggle("danger",  pct >= 100);
    }

    const alert = document.getElementById("budgetAlert");
    if (!alert) return;
    if (budget === 0) {
        alert.className = "alert-box";
        alert.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span>Set a monthly budget to start tracking.</span>`;
    } else if (pct >= 100) {
        alert.className = "alert-box danger";
        alert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>Budget exceeded by ${money(spent-budget)}.</span>`;
    } else if (pct >= 80) {
        alert.className = "alert-box warning";
        alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span>You've used ${pct.toFixed(1)}% of your monthly budget.</span>`;
    } else {
        alert.className = "alert-box";
        alert.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>You're within budget. Keep it up!</span>`;
    }
}


/* ==================================
   18. CATEGORY BUDGETS
================================== */

function getSelectedCategoryBudgets() {
    if (!categoryBudgets[selectedMonth]) categoryBudgets[selectedMonth] = {};
    return categoryBudgets[selectedMonth];
}

function bindCategoryBudgetForm() {
    document.getElementById("categoryBudgetForm")?.addEventListener("submit", e => {
        e.preventDefault();
        const cat    = document.getElementById("categoryBudgetCategory").value;
        const amount = Number(document.getElementById("categoryBudgetAmount").value);
        if (!validAmount(amount)) { showToast("Enter a valid category budget.", "error"); return; }
        const prev = structuredClone(categoryBudgets);
        getSelectedCategoryBudgets()[cat] = toPaise(amount) / 100;
        if (!writeStorage(STORAGE_KEYS.categoryBudgets, categoryBudgets)) { categoryBudgets = prev; return; }
        document.getElementById("categoryBudgetAmount").value = "";
        renderAll();
        showToast("Category budget saved.");
    });

    document.getElementById("categoryBudgetsList")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-category-delete]");
        if (!btn) return;
        const cat = btn.dataset.categoryDelete;
        const mb  = getSelectedCategoryBudgets();
        if (!(cat in mb)) return;
        const prev = structuredClone(categoryBudgets);
        delete mb[cat];
        if (!writeStorage(STORAGE_KEYS.categoryBudgets, categoryBudgets)) { categoryBudgets = prev; return; }
        renderAll();
        showToast("Category budget removed.");
    });
}

function renderCategoryBudgets() {
    const container = document.getElementById("categoryBudgetsList");
    if (!container) return;
    const mb  = getSelectedCategoryBudgets();
    const exp = getCategoryExpenses();
    const entries = Object.entries(mb);
    if (!entries.length) {
        container.innerHTML = `<div class="empty-card"><i class="fa-solid fa-chart-pie"></i>
            No category budgets yet.<br>Set a limit for Food, Shopping, Transport, etc.</div>`;
        return;
    }
    container.innerHTML = entries.map(([cat, budget]) => {
        const spent = exp[cat] || 0;
        const pct   = budget > 0 ? spent / budget * 100 : 0;
        const cls   = pct >= 100 ? "danger" : pct >= 80 ? "warning" : "";
        return `<div class="category-budget-card">
            <div class="panel-header">
                <div><h4>${escapeHTML(cat)}</h4><p>${money(spent)} of ${money(budget)}</p></div>
                <button class="action-button delete" data-category-delete="${escapeHTML(cat)}" aria-label="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="progress-track">
                <div class="progress-fill ${cls}" style="width:${Math.min(pct,100)}%"></div>
            </div>
            <p>${pct.toFixed(1)}% used</p>
        </div>`;
    }).join("");
}


/* ==================================
   19. SAVINGS GOALS
================================== */

function openGoalModal(goal = null) {
    editingGoalId = goal ? goal.id : null;
    document.getElementById("goalForm")?.reset();
    document.getElementById("goalId").value = goal ? goal.id : "";
    document.getElementById("goalModalTitle").textContent = goal ? "Edit Savings Goal" : "Create Savings Goal";
    document.getElementById("goalName").value  = goal ? goal.name : "";
    document.getElementById("goalTarget").value = goal ? goal.target : "";
    document.getElementById("goalSaved").value  = goal ? goal.saved : 0;
    document.getElementById("goalDate").value   = goal ? goal.targetDate || "" : "";
    openModal("goalModal");
}

function bindGoalButtons() {
    document.getElementById("addGoalButton")?.addEventListener("click", () => openGoalModal());

    document.getElementById("goalForm")?.addEventListener("submit", e => {
        e.preventDefault();
        const name       = document.getElementById("goalName").value.trim();
        const target     = Number(document.getElementById("goalTarget").value);
        const saved      = Number(document.getElementById("goalSaved").value);
        const targetDate = document.getElementById("goalDate").value;
        if (!name || !validAmount(target) || !validAmount(saved, true)) { showToast("Enter valid goal details.", "error"); return; }
        if (saved > target) { showToast("Saved amount cannot exceed the target.", "error"); return; }
        if (targetDate && !validDateString(targetDate)) { showToast("Choose a valid target date.", "error"); return; }
        if (targetDate && targetDate < getToday()) { showToast("Target date cannot be in the past.", "error"); return; }
        const prev = [...goals];
        const goal = { id: editingGoalId || makeId(), name: name.slice(0, 60),
            target: toPaise(target)/100, saved: toPaise(saved)/100, targetDate };
        if (editingGoalId !== null) {
            const idx = goals.findIndex(g => String(g.id) === String(editingGoalId));
            if (idx === -1) { showToast("Goal not found.", "error"); return; }
            goals[idx] = goal;
        } else { goals.push(goal); }
        if (!writeStorage(STORAGE_KEYS.goals, goals)) { goals = prev; return; }
        closeModal("goalModal");
        renderAll();
        showToast(editingGoalId !== null ? "Savings goal updated." : "Savings goal created.");
        editingGoalId = null;
    });

    document.getElementById("goalsGrid")?.addEventListener("click", e => {
        const contribute = e.target.closest("[data-goal-contribute]");
        const edit       = e.target.closest("[data-goal-edit]");
        const del        = e.target.closest("[data-goal-delete]");
        if (contribute) {
            const goal = goals.find(g => String(g.id) === String(contribute.dataset.goalContribute));
            if (goal) {
                document.getElementById("contributionGoalId").value = goal.id;
                document.getElementById("contributionAmount").value = "";
                document.getElementById("contributionAmount").max = Math.max(0, goal.target - goal.saved);
                openModal("contributionModal");
            }
        }
        if (edit) {
            const goal = goals.find(g => String(g.id) === String(edit.dataset.goalEdit));
            if (goal) openGoalModal(goal);
        }
        if (del) deleteGoal(del.dataset.goalDelete);
    });

    document.getElementById("contributionForm")?.addEventListener("submit", e => {
        e.preventDefault();
        const id     = document.getElementById("contributionGoalId").value;
        const amount = Number(document.getElementById("contributionAmount").value);
        const goal   = goals.find(g => String(g.id) === String(id));
        if (!goal || !validAmount(amount)) { showToast("Enter a valid savings amount.", "error"); return; }
        if (toPaise(goal.saved) + toPaise(amount) > toPaise(goal.target)) {
            showToast("Amount exceeds the remaining goal.", "error"); return;
        }
        const prev = [...goals];
        goal.saved = (toPaise(goal.saved) + toPaise(amount)) / 100;
        if (!writeStorage(STORAGE_KEYS.goals, goals)) { goals = prev; return; }
        closeModal("contributionModal");
        renderAll();
        showToast(goal.saved >= goal.target ? "Congratulations! Goal completed." : "Savings added.");
    });
}

function renderGoals() {
    const container = document.getElementById("goalsGrid");
    if (!container) return;
    if (!goals.length) {
        container.innerHTML = `<div class="empty-card"><i class="fa-solid fa-bullseye"></i>
            No savings goals yet.<br>Create your first goal and start planning your future.</div>`;
        return;
    }
    container.innerHTML = goals.map(goal => {
        const pct = Math.min(goal.saved / goal.target * 100, 100);
        const done = goal.saved >= goal.target;
        const targetText = goal.targetDate ? "Target: " + formatDate(goal.targetDate) : "No target date";
        return `<article class="goal-card">
            <div class="goal-card-header">
                <div class="goal-icon"><i class="fa-solid ${done ? "fa-circle-check" : "fa-bullseye"}"></i></div>
                <div class="goal-title">
                    <h3>${escapeHTML(goal.name)}</h3>
                    <p>${escapeHTML(targetText)}</p>
                </div>
                <span class="goal-percentage">${pct.toFixed(1)}%</span>
            </div>
            <div class="goal-amounts"><strong>${money(goal.saved)}</strong><span>of ${money(goal.target)}</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <p class="card-description">${done ? "Congratulations! Goal achieved." : money(goal.target - goal.saved) + " left to reach your goal."}</p>
            <div class="goal-actions">
                ${done ? "" : `<button class="primary-button" data-goal-contribute="${escapeHTML(goal.id)}">
                    <i class="fa-solid fa-plus"></i> Add Savings</button>`}
                <button class="secondary-button" data-goal-edit="${escapeHTML(goal.id)}">Edit</button>
                <button class="secondary-button" data-goal-delete="${escapeHTML(goal.id)}">Delete</button>
            </div>
        </article>`;
    }).join("");
}

function deleteGoal(id) {
    const goal = goals.find(g => String(g.id) === String(id));
    if (!goal) return;
    if (!confirm(`Delete savings goal "${goal.name}"?`)) return;
    const prev = [...goals];
    goals = goals.filter(g => String(g.id) !== String(id));
    if (!writeStorage(STORAGE_KEYS.goals, goals)) { goals = prev; return; }
    renderAll();
    showToast("Savings goal deleted.");
}


/* ==================================
   20. SMART INSIGHTS
================================== */

function generateInsights() {
    const stats = getMonthStats();
    const budget = getMonthlyBudget();
    const catExp = getCategoryExpenses();
    const insights = [];

    if (budget === 0) {
        insights.push({ icon:"fa-lightbulb", title:"Set a monthly budget", text:"Choose a realistic spending limit to monitor your progress." });
    } else {
        const usage = stats.expenses / budget * 100;
        if      (usage >= 100) insights.push({ icon:"fa-triangle-exclamation", title:"Budget exceeded", text:`You've spent ${money(stats.expenses - budget)} beyond your budget.` });
        else if (usage >= 80)  insights.push({ icon:"fa-bell", title:"Budget nearly reached", text:`You've used ${usage.toFixed(1)}% of your budget.` });
        else                   insights.push({ icon:"fa-circle-check", title:"Budget progress", text:`You've used ${usage.toFixed(1)}% of your planned budget.` });
    }

    const catEntries = Object.entries(catExp).sort((a,b) => toPaise(b[1]) - toPaise(a[1]));
    if (catEntries.length) {
        const [cat, amt] = catEntries[0];
        const share = stats.expenses > 0 ? amt / stats.expenses * 100 : 0;
        insights.push({ icon: CATEGORY_ICON_MAP[cat] || "fa-chart-pie", title:"Top spending category",
            text:`${cat} accounts for ${share.toFixed(1)}% of your expenses.` });
    }

    if (stats.income > 0) {
        const rate = stats.savings / stats.income * 100;
        insights.push({ icon:"fa-piggy-bank", title:"Savings rate",
            text: rate >= 0
                ? `You're retaining ${rate.toFixed(1)}% of your income.`
                : `Your expenses exceed income by ${money(Math.abs(stats.savings))}.` });
    } else {
        insights.push({ icon:"fa-coins", title:"Track your income", text:"Record your income to understand your overall financial position." });
    }

    return insights.slice(0, 4);
}

function renderInsights() {
    const container = document.getElementById("insightsList");
    if (!container) return;
    const insights = generateInsights();
    container.innerHTML = insights.map(i => `
        <div class="insight-item">
            <div class="insight-icon"><i class="fa-solid ${i.icon}"></i></div>
            <div><strong>${escapeHTML(i.title)}</strong><p>${escapeHTML(i.text)}</p></div>
        </div>`).join("");
}


/* ==================================
   21. CHARTS
================================== */

function chartDefaults() {
    const textColor = getComputedStyle(document.body).getPropertyValue("--text-secondary").trim() || "#718096";
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: textColor, usePointStyle:true, padding:18, font:{ family:"Inter", size:10 } } },
            tooltip: { callbacks: { label(ctx) { return ctx.dataset.label ? `${ctx.dataset.label}: ${money(ctx.raw)}` : money(ctx.raw); } } }
        }
    };
}

function destroyChart(c) { if (c) c.destroy(); }

function updateCharts() {
    if (typeof Chart === "undefined") return;
    const [year, month] = selectedMonth.split("-").map(Number);
    const months = [], incomeData = [], expenseData = [];
    for (let offset = 5; offset >= 0; offset--) {
        const d = new Date(year, month - 1 - offset, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        months.push(d.toLocaleString("en-IN", { month:"short" }));
        const s = getMonthStats(key);
        incomeData.push(s.income);
        expenseData.push(s.expenses);
    }
    const catExp  = getCategoryExpenses();
    const catKeys = Object.keys(catExp);
    const catAmts = catKeys.map(k => catExp[k]);
    const gridColor = getComputedStyle(document.body).getPropertyValue("--border").trim() || "#e7edf3";
    const tickColor = getComputedStyle(document.body).getPropertyValue("--text-secondary").trim() || "#718096";
    const tickCb = v => "₹" + Number(v).toLocaleString("en-IN");

    const ieCanvas = document.getElementById("incomeExpenseChart");
    if (ieCanvas) {
        destroyChart(incomeExpenseChart);
        incomeExpenseChart = new Chart(ieCanvas, {
            type:"bar",
            data:{ labels:months, datasets:[
                { label:"Income",   data:incomeData,  backgroundColor:"#10a879", borderRadius:5, maxBarThickness:25 },
                { label:"Expenses", data:expenseData, backgroundColor:"#f28b82", borderRadius:5, maxBarThickness:25 }
            ]},
            options:{ ...chartDefaults(), scales:{
                x:{ grid:{display:false}, ticks:{color:tickColor} },
                y:{ beginAtZero:true, grid:{color:gridColor}, ticks:{color:tickColor, callback:tickCb} }
            }}
        });
    }

    const catCanvas = document.getElementById("categoryChart");
    if (catCanvas) {
        destroyChart(categoryChart);
        categoryChart = new Chart(catCanvas, {
            type:"doughnut",
            data:{ labels:catKeys.length ? catKeys : ["No expenses"],
                   datasets:[{ data:catKeys.length ? catAmts : [1],
                   backgroundColor:["#10a879","#5278e8","#f4ad4e","#e65c65","#8d72d8","#42b6c5","#d78aaf","#94a3b8","#d4bd58","#4a9e7e","#b48b63"],
                   borderWidth:0, hoverOffset:5 }]},
            options:{ ...chartDefaults(), cutout:"70%",
                plugins:{ ...chartDefaults().plugins,
                    legend:{ position:"bottom", labels:chartDefaults().plugins.legend.labels },
                    tooltip:{ callbacks:{ label(ctx) { return catKeys.length ? `${ctx.label}: ${money(ctx.raw)}` : "No expenses recorded"; } } }
                }}
        });
    }

    const trendCanvas = document.getElementById("trendChart");
    if (trendCanvas) {
        destroyChart(trendChart);
        trendChart = new Chart(trendCanvas, {
            type:"line",
            data:{ labels:months, datasets:[
                { label:"Income",   data:incomeData,  borderColor:"#10a879", backgroundColor:"rgba(16,168,121,0.1)", fill:true, tension:0.35, pointRadius:3 },
                { label:"Expenses", data:expenseData, borderColor:"#e65c65", backgroundColor:"rgba(230,92,101,0.08)", fill:true, tension:0.35, pointRadius:3 }
            ]},
            options:{ ...chartDefaults(), scales:{
                x:{ grid:{display:false}, ticks:{color:tickColor} },
                y:{ beginAtZero:true, grid:{color:gridColor}, ticks:{color:tickColor, callback:tickCb} }
            }}
        });
    }
}


/* ==================================
   22. ANALYTICS PAGE
================================== */

function updateAnalytics() {
    const stats = getMonthStats();
    const catExp = getCategoryExpenses();
    const entries = Object.entries(catExp).sort((a,b) => toPaise(b[1]) - toPaise(a[1]));
    const el = document.getElementById("categoryAnalysis");
    if (!el) return;
    if (!entries.length) {
        el.innerHTML = `<div class="empty-state">No expense data available for this month.</div>`;
    } else {
        el.innerHTML = entries.map(([cat, amt]) => {
            const pct = stats.expenses > 0 ? amt / stats.expenses * 100 : 0;
            return `<div class="category-analysis-row">
                <div class="category-analysis-header">
                    <span>${escapeHTML(cat)}</span>
                    <span>${money(amt)} · ${pct.toFixed(1)}%</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
        }).join("");
    }
    updateCharts();
}


/* ==================================
   23. BUDGET PAGE
================================== */

function updateBudgetPage() {
    const stats  = getMonthStats();
    const budget = getMonthlyBudget();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("budgetPageMonth",        formatMonth(selectedMonth));
    set("budgetOverviewLimit",    money(budget));
    set("budgetOverviewSpent",    money(stats.expenses));
    set("budgetOverviewRemaining",money(budget - stats.expenses));
    renderCategoryBudgets();
}


/* ==================================
   24. EXPORT CSV
================================== */

function exportCSV() {
    const items = getMonthTransactions();
    if (!items.length) { showToast("No transactions for the selected month.", "error"); return; }
    const headers = ["Date","Type","Category","Description","Amount","Account","From Account","To Account"];
    const rows = items.map(t => [t.date, t.type, t.category, t.description,
        Number(t.amount).toFixed(2), t.account||"", t.fromAccount||"", t.toAccount||""]);
    function csvCell(v) {
        let text = String(v ?? "");
        if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }
    const csv = [headers, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `finora-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("CSV report downloaded.");
}


/* ==================================
   25. EXPORT EXCEL (.xlsx)
================================== */

function exportExcel() {
    if (typeof XLSX === "undefined") {
        showToast("Excel library not loaded. Please check internet connection.", "error"); return;
    }
    if (!transactions.length) { showToast("No transactions to export.", "error"); return; }

    const wb = XLSX.utils.book_new();

    // --- Transactions sheet ---
    const txnRows = transactions.map(t => ({
        "Date":          t.date,
        "Type":          t.type.charAt(0).toUpperCase() + t.type.slice(1),
        "Category":      t.category,
        "Description":   t.description || "",
        "Amount (₹)":   Number(t.amount).toFixed(2),
        "Account":       t.account || "",
        "From Account":  t.fromAccount || "",
        "To Account":    t.toAccount || ""
    }));
    const txnSheet = XLSX.utils.json_to_sheet(txnRows);
    // Column widths
    txnSheet["!cols"] = [12, 10, 15, 30, 14, 12, 14, 14].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, txnSheet, "Transactions");

    // --- Monthly Summary sheet ---
    const stats = getMonthStats();
    const budget = getMonthlyBudget();
    const rate = stats.income > 0 ? (stats.savings / stats.income * 100).toFixed(1) + "%" : "0%";
    const summaryRows = [
        { "Field":"Month",            "Value": formatMonth(selectedMonth) },
        { "Field":"Total Income",     "Value": Number(stats.income).toFixed(2) },
        { "Field":"Total Expenses",   "Value": Number(stats.expenses).toFixed(2) },
        { "Field":"Net Balance",      "Value": Number(stats.savings).toFixed(2) },
        { "Field":"Monthly Budget",   "Value": Number(budget).toFixed(2) },
        { "Field":"Budget Remaining", "Value": Number(budget - stats.expenses).toFixed(2) },
        { "Field":"Savings Rate",     "Value": rate },
        { "Field":"Transactions",     "Value": stats.count },
        { "Field":"Savings Goals",    "Value": goals.length },
        { "Field":"Goals Completed",  "Value": goals.filter(g => g.saved >= g.target).length }
    ];
    const summSheet = XLSX.utils.json_to_sheet(summaryRows);
    summSheet["!cols"] = [22, 18].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, summSheet, "Summary");

    // --- Goals sheet ---
    if (goals.length) {
        const goalRows = goals.map(g => ({
            "Goal Name":       g.name,
            "Target (₹)":     Number(g.target).toFixed(2),
            "Saved (₹)":      Number(g.saved).toFixed(2),
            "Progress (%)":   (g.saved / g.target * 100).toFixed(1) + "%",
            "Status":         g.saved >= g.target ? "Completed" : "In Progress",
            "Target Date":    g.targetDate || "—"
        }));
        const goalSheet = XLSX.utils.json_to_sheet(goalRows);
        goalSheet["!cols"] = [25, 14, 14, 14, 14, 14].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, goalSheet, "Savings Goals");
    }

    XLSX.writeFile(wb, `finora-report-${selectedMonth}.xlsx`);
    showToast("Excel report downloaded successfully.");
}


/* ==================================
   26. MONTHLY REPORTS
================================== */

function updateReports() {
    const stats = getMonthStats();
    const budget = getMonthlyBudget();
    const rate = stats.income > 0 ? stats.savings / stats.income * 100 : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("reportMonth", formatMonth(selectedMonth));

    const items = [
        ["Total Income", money(stats.income)],
        ["Total Expenses", money(stats.expenses)],
        ["Net Balance", money(stats.savings)],
        ["Monthly Budget", money(budget)],
        ["Budget Remaining", money(budget - stats.expenses)],
        ["Savings Rate", rate.toFixed(1) + "%"],
        ["Transactions", String(stats.count)],
        ["Savings Goals", String(goals.length)]
    ];

    const rs = document.getElementById("reportSummary");
    if (rs) rs.innerHTML = items.map(([l,v]) => `
        <div class="report-item"><span>${escapeHTML(l)}</span><h3>${escapeHTML(v)}</h3></div>`).join("");

    const health = [];
    if (budget > 0) {
        const u = stats.expenses / budget * 100;
        health.push(u <= 80 ? "Your spending is within a comfortable budget range."
            : u < 100 ? "Your budget is nearly used. Monitor upcoming expenses."
            : "Your expenses have exceeded your planned budget.");
    } else { health.push("Set a monthly budget to monitor spending."); }
    health.push(stats.income > 0
        ? (stats.savings >= 0 ? `Your savings rate is ${rate.toFixed(1)}%.` : "Your expenses are greater than income this month.")
        : "Record income to calculate your savings rate.");
    health.push(`${stats.count} transactions recorded for ${formatMonth(selectedMonth)}.`);
    health.push(`${goals.filter(g => g.saved >= g.target).length} of ${goals.length} savings goals completed.`);

    const fh = document.getElementById("financialHealth");
    if (fh) fh.innerHTML = health.map(h => `
        <div class="health-item"><i class="fa-solid fa-circle-check"></i><span>${escapeHTML(h)}</span></div>`).join("");
}

function bindReportButtons() {
    document.getElementById("exportCsvButton")?.addEventListener("click", exportCSV);
    document.getElementById("exportExcelButton")?.addEventListener("click", exportExcel);
}


/* ==================================
   27. NOTIFICATIONS
================================== */

function updateNotifications() {
    const stats = getMonthStats();
    const budget = getMonthlyBudget();
    const catExp = getCategoryExpenses();
    notifications = [];

    if (budget > 0) {
        const pct = stats.expenses / budget * 100;
        if (pct >= 100) notifications.push(`Budget exceeded by ${money(stats.expenses - budget)}.`);
        else if (pct >= 80) notifications.push(`You've used ${pct.toFixed(1)}% of your monthly budget.`);
    }

    Object.entries(categoryBudgets).forEach(([m, mb]) => {
        if (m !== selectedMonth) return;
        Object.entries(mb).forEach(([cat, limit]) => {
            const spent = catExp[cat] || 0;
            if (limit > 0 && spent >= limit)
                notifications.push(`${cat} budget reached: ${money(spent)} spent of ${money(limit)}.`);
        });
    });

    const done = goals.filter(g => g.saved >= g.target).length;
    if (done > 0) notifications.push(`${done} savings goal${done > 1 ? "s" : ""} completed.`);

    const nl = document.getElementById("notificationList");
    if (nl) nl.innerHTML = notifications.length
        ? notifications.map(m => `<div class="notification-item"><i class="fa-solid fa-circle-info"></i><p>${escapeHTML(m)}</p></div>`).join("")
        : `<div class="empty-state">You're all caught up. No financial alerts right now.</div>`;

    const dot = $(".notification-dot");
    if (dot) dot.style.display = notifications.length ? "block" : "none";
}

function bindNotificationButtons() {
    document.getElementById("notificationButton")?.addEventListener("click", () => {
        updateNotifications();
        document.getElementById("notificationPanel")?.classList.toggle("open");
    });
    document.getElementById("closeNotifications")?.addEventListener("click", () => {
        document.getElementById("notificationPanel")?.classList.remove("open");
    });
    document.addEventListener("click", e => {
        const panel = document.getElementById("notificationPanel");
        const btn   = document.getElementById("notificationButton");
        if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target))
            panel.classList.remove("open");
    });
}


/* ==================================
   28. FEEDBACK
================================== */

function bindFeedback() {
    let feedbackRating = 0;

    document.getElementById("feedbackButton")?.addEventListener("click", () => {
        openModal("feedbackModal");
    });

    const stars = $$(".star");
    stars.forEach(star => {
        star.addEventListener("click", () => {
            feedbackRating = Number(star.dataset.star);
            document.getElementById("feedbackRating").value = feedbackRating;
            stars.forEach((s, i) => {
                s.querySelector("i").className = i < feedbackRating
                    ? "fa-solid fa-star" : "fa-regular fa-star";
                s.classList.toggle("active", i < feedbackRating);
            });
        });
        star.addEventListener("mouseover", () => {
            const hovered = Number(star.dataset.star);
            stars.forEach((s, i) => {
                s.querySelector("i").className = i < hovered
                    ? "fa-solid fa-star" : "fa-regular fa-star";
            });
        });
        star.addEventListener("mouseout", () => {
            stars.forEach((s, i) => {
                s.querySelector("i").className = i < feedbackRating
                    ? "fa-solid fa-star" : "fa-regular fa-star";
            });
        });
    });

    document.getElementById("feedbackForm")?.addEventListener("submit", e => {
        e.preventDefault();
        const rating   = Number(document.getElementById("feedbackRating").value);
        const category = document.getElementById("feedbackCategory").value;
        const text     = document.getElementById("feedbackText").value.trim();

        if (!text) { showToast("Please write your feedback before submitting.", "error"); return; }

        // In a real app, send to backend. Here we just acknowledge.
        console.log("Feedback submitted:", { rating, category, text });
        closeModal("feedbackModal");
        document.getElementById("feedbackForm").reset();
        feedbackRating = 0;
        stars.forEach(s => { s.querySelector("i").className = "fa-regular fa-star"; s.classList.remove("active"); });
        document.getElementById("feedbackRating").value = 0;
        showToast("Thank you for your feedback! 🎉");
    });
}


/* ==================================
   29. CALCULATOR
================================== */

function bindCalculator() {
    let calcDisplay  = "0";
    let firstOperand = null;
    let operator     = null;
    let waitingNext  = false;
    let expression   = "";

    function updateCalcDisplay() {
        const res = document.getElementById("calcResult");
        const exp = document.getElementById("calcExpression");
        if (res) res.textContent = calcDisplay;
        if (exp) exp.textContent = expression;
    }

    function calcInput(val) {
        const ops = ["+", "−", "×", "÷"];

        if (val === "C") {
            calcDisplay = "0"; firstOperand = null;
            operator = null; waitingNext = false; expression = "";
            updateCalcDisplay(); return;
        }

        if (val === "±") {
            calcDisplay = String(-parseFloat(calcDisplay));
            updateCalcDisplay(); return;
        }

        if (val === "%") {
            calcDisplay = String(parseFloat(calcDisplay) / 100);
            updateCalcDisplay(); return;
        }

        if (ops.includes(val)) {
            if (firstOperand !== null && !waitingNext) {
                const result = calculate(firstOperand, parseFloat(calcDisplay), operator);
                calcDisplay = String(parseFloat(result.toFixed(10)));
                firstOperand = parseFloat(calcDisplay);
            } else {
                firstOperand = parseFloat(calcDisplay);
            }
            operator   = val;
            waitingNext = true;
            expression  = `${firstOperand} ${val}`;
            updateCalcDisplay(); return;
        }

        if (val === "=") {
            if (operator && firstOperand !== null) {
                const result = calculate(firstOperand, parseFloat(calcDisplay), operator);
                expression  = `${firstOperand} ${operator} ${calcDisplay} =`;
                calcDisplay = String(parseFloat(result.toFixed(10)));
                firstOperand = null; operator = null; waitingNext = false;
            }
            updateCalcDisplay(); return;
        }

        if (val === ".") {
            if (!calcDisplay.includes(".")) calcDisplay += ".";
            updateCalcDisplay(); return;
        }

        // digit
        if (waitingNext) {
            calcDisplay = val;
            waitingNext = false;
        } else {
            calcDisplay = calcDisplay === "0" ? val : calcDisplay + val;
        }
        if (operator) expression = `${firstOperand} ${operator} ${calcDisplay}`;
        updateCalcDisplay();
    }

    function calculate(a, b, op) {
        switch (op) {
            case "+": return a + b;
            case "−": return a - b;
            case "×": return a * b;
            case "÷": return b !== 0 ? a / b : 0;
            default:  return b;
        }
    }

    // FAB toggle
    const fab    = document.getElementById("calcFab");
    const widget = document.getElementById("calculatorWidget");
    const closeBtn = document.getElementById("closeCalc");

    if (fab && widget) {
        fab.addEventListener("click", () => {
            const isVisible = widget.style.display !== "none";
            widget.style.display = isVisible ? "none" : "block";
        });
    }
    if (closeBtn && widget) {
        closeBtn.addEventListener("click", () => { widget.style.display = "none"; });
    }

    // Calculator buttons
    widget?.querySelectorAll(".calc-btn").forEach(btn => {
        btn.addEventListener("click", () => calcInput(btn.dataset.val));
    });

    // Keyboard support for calculator
    document.addEventListener("keydown", e => {
        if (!widget || widget.style.display === "none") return;
        const map = { "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
            "+":"+","-":"−","*":"×","/":"÷","Enter":"=","=":"=",".":".","%":"%","Escape":"C","Backspace":"C" };
        if (map[e.key]) calcInput(map[e.key]);
    });
}


/* ==================================
   30. DARK MODE
================================== */

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
    const icon = document.getElementById("themeIcon");
    if (icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    try { localStorage.setItem(STORAGE_KEYS.theme, theme); } catch {}
    if (typeof Chart !== "undefined") updateCharts();
}

function bindThemeToggle() {
    document.getElementById("themeToggle")?.addEventListener("click", () => {
        const isDark = document.body.classList.contains("dark-mode");
        applyTheme(isDark ? "light" : "dark");
        showToast(isDark ? "Light mode enabled." : "Dark mode enabled.");
    });
}


/* ==================================
   31. MASTER RENDER
================================== */

function renderAll() {
    updateSummary();
    updateBudget();
    renderRecentTransactions();
    populateCategoryFilter();
    renderAllTransactions();
    renderInsights();
    updateCharts();
    updateBudgetPage();
    renderGoals();
    updateAnalytics();
    updateReports();
    updateNotifications();
}


/* ==================================
   32. INITIALIZE APPLICATION
================================== */

function initializeApp() {
    normalizeData();

    // Theme
    let theme = "light";
    try { theme = localStorage.getItem(STORAGE_KEYS.theme) || "light"; } catch {}
    applyTheme(theme);

    // Wire everything
    bindModalClosers();
    bindNavigation();
    bindThemeToggle();
    bindNotificationButtons();
    bindTransactionButtons();
    bindTransactionForm();
    bindTransactionFilters();
    bindBudgetButtons();
    bindCategoryBudgetForm();
    bindGoalButtons();
    bindReportButtons();
    bindFeedback();
    bindCalculator();
    initMonthPicker();

    // Initial category chips (income default)
    renderCategoryChips("income");

    const requestedPage = location.hash.replace("#", "");
    if (pageTitles[requestedPage]) currentPage = requestedPage;

    renderAll();
    navigateTo(currentPage);
    console.log("Finora initialized.");
}


/* ==================================
   33. BOOT
================================== */

initOtpInputs();

if (!checkExistingSession()) {
    showLoginStep("loginStep1");
}