import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Field({ label, value, onChange, type = "text", placeholder, disabled, hint }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition disabled:opacity-50" />
      {hint && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="border-b border-[var(--border)] pb-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Msg({ msg, isError }) {
  if (!msg) return null;
  return (
    <p className={`text-xs px-3 py-2 rounded-lg ${isError
      ? "bg-[var(--error-bg)] text-[var(--error-text)]"
      : "bg-[var(--success-bg)] text-[var(--success-text)]"}`}>
      {msg}
    </p>
  );
}

function SaveBtn({ loading, label = "Save Changes", disabled }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
      {loading ? "Saving..." : label}
    </button>
  );
}

function PasswordSection({ savePwd, currentPwd, setCurrentPwd, newPwd, setNewPwd, pwdMsg, pwdLoading }) {
  return (
    <Section title="Change Password">
      <form onSubmit={savePwd} className="space-y-4">
        <Field label="Current Password" value={currentPwd} onChange={setCurrentPwd}
          type="password" placeholder="••••••••" />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[var(--text-muted)]">New Password</label>
            <a href="/forgot-password" className="text-xs text-indigo-500 hover:underline">
              Forgot current password?
            </a>
          </div>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition" />
        </div>
        <Msg msg={pwdMsg.text} isError={pwdMsg.error} />
        <SaveBtn loading={pwdLoading} label="Change Password" />
      </form>
    </Section>
  );
}

function DeleteAccountSection({ role, deleteRequested }) {
  const { logoutUser } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", error: false });
  const [requested, setRequested] = useState(deleteRequested || false);

  async function handleDelete() {
    setLoading(true);
    try {
      if (role === "candidate") {
        await api.delete("/settings/account");
        logoutUser();
      } else {
        await api.post("/settings/account/delete-request");
        setRequested(true);
        setShowConfirm(false);
        setMsg({ text: "Deletion request submitted. Admin will review it.", error: false });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="bg-[var(--bg-surface)] border border-[var(--error-border)] rounded-2xl p-6">
        <div className="border-b border-[var(--error-border)] pb-3 mb-4">
          <p className="text-sm font-semibold text-[var(--error-text)]">Danger Zone</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {role === "candidate"
              ? "Permanently delete your account and all associated data."
              : "Request account deletion — admin approval required."}
          </p>
        </div>
        {requested && role === "recruiter" ? (
          <div className="bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-xl p-3 text-xs text-[var(--warning-text)]">
            ⏳ Your deletion request is pending admin review.
          </div>
        ) : (
          <>
            <Msg msg={msg.text} isError={msg.error} />
            <button onClick={() => setShowConfirm(true)}
              className="bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error-border)] px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition">
              {role === "candidate" ? "Delete My Account" : "Request Account Deletion"}
            </button>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConfirm(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {role === "candidate" ? "Delete Account?" : "Request Account Deletion?"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {role === "candidate"
                  ? "This will permanently delete your account, resume, and all applications. This cannot be undone."
                  : "A request will be sent to admin. Your account will be deleted after approval."}
              </p>
            </div>
            <div className="mb-4">
              <label className="text-xs text-[var(--text-muted)] mb-1 block">
                Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm
              </label>
              <input type="text" value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="flex-1 border border-[var(--border)] text-[var(--text-secondary)] py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--bg-surface-2)] transition">
                Cancel
              </button>
              <button onClick={handleDelete}
                disabled={confirmText !== "DELETE" || loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {loading ? "Processing..." : role === "candidate" ? "Delete Forever" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CandidateSettings({ profile }) {
  const { user, loginUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [basicMsg, setBasicMsg] = useState({ text: "", error: false });
  const [basicLoading, setBasicLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState({ text: "", error: false });
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState({ text: "", error: false });
  const [pwdLoading, setPwdLoading] = useState(false);

  async function saveBasic(e) {
    e.preventDefault(); setBasicLoading(true);
    try {
      const res = await api.patch("/settings/basic", { name, phone });
      loginUser({ ...user, name: res.data.user.name });
      setBasicMsg({ text: "Saved!", error: false });
    } catch (err) {
      setBasicMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setBasicLoading(false); }
  }

  async function sendEmailChange(e) {
    e.preventDefault(); setEmailLoading(true);
    try {
      const res = await api.post("/settings/email-change", { newEmail });
      setEmailMsg({ text: res.data.message, error: false }); setNewEmail("");
    } catch (err) {
      setEmailMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setEmailLoading(false); }
  }

  async function savePwd(e) {
    e.preventDefault(); setPwdLoading(true);
    try {
      await api.patch("/settings/password", { currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg({ text: "Password changed!", error: false });
      setCurrentPwd(""); setNewPwd("");
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setPwdLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <Section title="Basic Information">
        <form onSubmit={saveBasic} className="space-y-4">
          <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 XXXXXXXXXX" />
          <Field label="Email" value={user?.email} onChange={() => {}} disabled
            hint="To change email, use the section below." />
          <Msg msg={basicMsg.text} isError={basicMsg.error} />
          <SaveBtn loading={basicLoading} />
        </form>
      </Section>

      {!user?.oauthProvider && (
        <Section title="Change Email" subtitle="A verification link will be sent to your new email.">
          <form onSubmit={sendEmailChange} className="space-y-4">
            <Field label="New Email Address" value={newEmail} onChange={setNewEmail}
              type="email" placeholder="new@email.com" />
            <Msg msg={emailMsg.text} isError={emailMsg.error} />
            <SaveBtn loading={emailLoading} label="Send Verification Link" />
          </form>
        </Section>
      )}

      {!user?.oauthProvider && (
        <PasswordSection savePwd={savePwd} currentPwd={currentPwd} setCurrentPwd={setCurrentPwd}
          newPwd={newPwd} setNewPwd={setNewPwd} pwdMsg={pwdMsg} pwdLoading={pwdLoading} />
      )}

      <DeleteAccountSection role="candidate" />
    </div>
  );
}

function RecruiterSettings({ profile }) {
  const { user, loginUser } = useAuth();
  const isFirstSetup = !profile?.profileSetupDone;
  const rp = profile?.recruiterProfile || {};

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [basicMsg, setBasicMsg] = useState({ text: "", error: false });
  const [basicLoading, setBasicLoading] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState({ text: "", error: false });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [companyName, setCompanyName] = useState(rp.companyName || "");
  const [companyWebsite, setCompanyWebsite] = useState(rp.companyWebsite || "");
  const [companySize, setCompanySize] = useState(rp.companySize || "");
  const [industry, setIndustry] = useState(rp.industry || "");
  const [designation, setDesignation] = useState(rp.designation || "");
  const [companyDescription, setCompanyDescription] = useState(rp.companyDescription || "");
  const [companyLocation, setCompanyLocation] = useState(rp.companyLocation || "");
  const [companyMsg, setCompanyMsg] = useState({ text: "", error: false });
  const [companyLoading, setCompanyLoading] = useState(false);

  async function saveBasic(e) {
    e.preventDefault(); setBasicLoading(true);
    try {
      const res = await api.patch("/settings/basic", { name, phone });
      loginUser({ ...user, name: res.data.user.name });
      setBasicMsg({ text: "Saved!", error: false });
    } catch (err) {
      setBasicMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setBasicLoading(false); }
  }

  async function savePwd(e) {
    e.preventDefault(); setPwdLoading(true);
    try {
      await api.patch("/settings/password", { currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg({ text: "Password changed!", error: false });
      setCurrentPwd(""); setNewPwd("");
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setPwdLoading(false); }
  }

  async function saveCompany(e) {
    e.preventDefault(); setCompanyLoading(true);
    try {
      const res = await api.patch("/settings/recruiter", {
        companyName, companyWebsite, companySize, industry,
        designation, companyDescription, companyLocation,
      });
      setCompanyMsg({ text: res.data.message, error: false });
      if (isFirstSetup) loginUser({ ...user, profileSetupDone: true });
    } catch (err) {
      setCompanyMsg({ text: err.response?.data?.message || "Failed.", error: true });
    } finally { setCompanyLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-xl">
      {isFirstSetup && (
        <div className="bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-2xl p-4">
          <p className="text-sm font-semibold text-[var(--warning-text)] mb-1">⚠️ Complete your company profile</p>
          <p className="text-xs text-[var(--warning-text)] opacity-80">You need to fill in your company details before you can post jobs.</p>
        </div>
      )}

      <Section title="Basic Information">
        <form onSubmit={saveBasic} className="space-y-4">
          <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 XXXXXXXXXX" />
          <Field label="Email" value={user?.email} onChange={() => {}} disabled />
          <Msg msg={basicMsg.text} isError={basicMsg.error} />
          <SaveBtn loading={basicLoading} />
        </form>
      </Section>

      {!user?.oauthProvider && (
        <PasswordSection savePwd={savePwd} currentPwd={currentPwd} setCurrentPwd={setCurrentPwd}
          newPwd={newPwd} setNewPwd={setNewPwd} pwdMsg={pwdMsg} pwdLoading={pwdLoading} />
      )}

      <Section title="Company Profile"
        subtitle={isFirstSetup ? "Required before posting jobs." : "This info appears on your job listings."}>
        <form onSubmit={saveCompany} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name *" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" />
            <Field label="Your Designation" value={designation} onChange={setDesignation} placeholder="HR Manager, CTO..." />
            <Field label="Company Website" value={companyWebsite} onChange={setCompanyWebsite} placeholder="https://company.com" />
            <Field label="Company Location" value={companyLocation} onChange={setCompanyLocation} placeholder="Bengaluru, India" />
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Company Size</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition">
                <option value="">Select size</option>
                {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
            <Field label="Industry" value={industry} onChange={setIndustry} placeholder="Technology, Finance..." />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Company Description</label>
            <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3}
              placeholder="Brief description of your company..."
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition resize-none" />
          </div>
          <Msg msg={companyMsg.text} isError={companyMsg.error} />
          <SaveBtn loading={companyLoading} label={isFirstSetup ? "Complete Setup & Start Posting" : "Save Company Profile"} />
        </form>
      </Section>

      <DeleteAccountSection role="recruiter" deleteRequested={profile?.deleteRequested} />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings/profile")
      .then((res) => setProfile(res.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 animate-pulse">
          <div className="h-4 w-32 bg-[var(--bg-surface-2)] rounded mb-4" />
          <div className="h-10 bg-[var(--bg-surface-2)] rounded-xl mb-3" />
          <div className="h-10 bg-[var(--bg-surface-2)] rounded-xl" />
        </div>
      ))}
    </div>
  );

  if (user?.role === "recruiter") return <RecruiterSettings profile={profile} />;
  return <CandidateSettings profile={profile} />;
}
