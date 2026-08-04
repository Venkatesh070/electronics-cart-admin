import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Headphones,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Rocket,
  Save,
  Tag,
  Target,
  TrendingUp,
  Users,
  Watch,
  X,
} from "lucide-react";
import { campaignsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { Badge, Button, Card, ErrorState, inputCls, LoadingState } from "../components/ui";
import clsx from "clsx";

const NAME_MAX = 100;
const SHORT_MAX = 160;
const TAGS_MAX = 10;

const STEPS = [
  { id: "info", label: "Campaign Info" },
  { id: "audience", label: "Audience" },
  { id: "channels", label: "Channels" },
  { id: "content", label: "Content" },
  { id: "review", label: "Review" },
];

const OBJECTIVES = [
  {
    id: "increase_sales",
    label: "Increase Sales",
    desc: "Drive revenue with offers",
    icon: TrendingUp,
  },
  {
    id: "generate_leads",
    label: "Generate Leads",
    desc: "Capture new prospects",
    icon: Users,
  },
  {
    id: "brand_awareness",
    label: "Brand Awareness",
    desc: "Grow brand visibility",
    icon: Megaphone,
  },
  {
    id: "customer_engagement",
    label: "Customer Engagement",
    desc: "Re-engage existing buyers",
    icon: MessageCircle,
  },
  {
    id: "clearance",
    label: "Clearance",
    desc: "Move inventory faster",
    icon: Tag,
  },
];

const TYPE_LABELS = {
  promotional: "Promotional",
  seasonal: "Seasonal",
  product_launch: "Product Launch",
  retention: "Retention",
  clearance: "Clearance",
};

const OBJECTIVE_LABELS = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o.label]));

const TIPS = [
  "Choose a clear and specific campaign objective.",
  "Set a realistic budget and schedule.",
  "Use a short, benefit-led campaign name.",
  "Preview content before you launch.",
];

const CHANNEL_OPTIONS = [
  { id: "email", label: "Email", desc: "Newsletters & offers" },
  { id: "sms", label: "SMS", desc: "Time-sensitive alerts" },
  { id: "push", label: "Push", desc: "App / web notifications" },
];

function FormField({ children, className }) {
  return <div className={clsx("mb-3.5", className)}>{children}</div>;
}

function Label({ children, required }) {
  return (
    <span className="block text-xs font-semibold text-ink mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </span>
  );
}

function SectionCard({ number, title, children, className }) {
  return (
    <Card className={clsx("p-5", className)}>
      <div className="flex items-center gap-2.5 mb-4">
        {number != null && (
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {number}
          </span>
        )}
        <h2 className="font-display font-semibold text-ink text-[15px]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function toLocalParts(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function fromLocalParts(date, time) {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function formatDuration(startsAt, endsAt) {
  if (!startsAt || !endsAt) return "—";
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return "Invalid range";
  const totalMins = Math.floor(ms / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  const parts = [];
  if (days) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
  if (hours || days) parts.push(`${hours} Hour${hours === 1 ? "" : "s"}`);
  parts.push(`${mins} Minute${mins === 1 ? "" : "s"}`);
  return parts.join(" ");
}

function blankForm() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 8 * 24 * 60 * 60 * 1000 - 60 * 1000);
  const sp = toLocalParts(start.toISOString());
  const ep = toLocalParts(end.toISOString());
  return {
    name: "",
    campaignType: "promotional",
    objective: "increase_sales",
    shortDescription: "",
    tags: [],
    startDate: sp.date,
    startTime: "00:00",
    endDate: ep.date,
    endTime: "23:59",
    timezone: "Asia/Kolkata",
    totalBudget: "",
    dailyBudget: "",
    maxDiscount: "",
    audience: "all",
    channels: ["email"],
    subject: "",
    message: "",
    status: "draft",
  };
}

function Stepper({ step, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-0 mb-6 overflow-x-auto">
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onChange(i)}
              className={clsx(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                active && "bg-primary text-white",
                done && !active && "text-primary",
                !active && !done && "text-muted"
              )}
            >
              <span
                className={clsx(
                  "w-5 h-5 rounded-full text-[10px] flex items-center justify-center border",
                  active && "bg-white text-primary border-white",
                  done && !active && "bg-primary text-white border-primary",
                  !active && !done && "border-border text-muted"
                )}
              >
                {done ? <Check size={11} /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={clsx("hidden sm:block w-8 h-px mx-1", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CampaignForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blankForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const existing = useAsync(
    async () => {
      if (!id) return null;
      const res = await campaignsApi.get(id);
      return res.data;
    },
    [id]
  );

  useEffect(() => {
    if (!existing.data) return;
    const c = existing.data;
    const start = toLocalParts(c.startsAt || c.scheduledAt);
    const end = toLocalParts(c.endsAt);
    let audience = "all";
    if (c.segment?.minSpend) audience = "vip";
    else if (c.segment?.minOrders) audience = "repeat";
    else if (c.segment?.role === "customer") audience = "customers";

    setForm({
      name: c.name || "",
      campaignType: c.campaignType || "promotional",
      objective: c.objective || "increase_sales",
      shortDescription: c.shortDescription || "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      startDate: start.date || blankForm().startDate,
      startTime: start.time || "00:00",
      endDate: end.date || blankForm().endDate,
      endTime: end.time || "23:59",
      timezone: c.timezone || "Asia/Kolkata",
      totalBudget: c.totalBudget != null ? String(c.totalBudget) : "",
      dailyBudget: c.dailyBudget != null ? String(c.dailyBudget) : "",
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      audience,
      channels: Array.isArray(c.channels) && c.channels.length ? c.channels : [c.channel || "email"],
      subject: c.subject || "",
      message: c.message || "",
      status: c.status || "draft",
    });
  }, [existing.data]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const startsAt = fromLocalParts(form.startDate, form.startTime);
  const endsAt = fromLocalParts(form.endDate, form.endTime);
  const durationLabel = formatDuration(startsAt, endsAt);

  function addTag(raw) {
    const value = String(raw || "").trim().replace(/,/g, "");
    if (!value || form.tags.includes(value) || form.tags.length >= TAGS_MAX) return;
    setForm((f) => ({ ...f, tags: [...f.tags, value] }));
    setTagInput("");
  }

  function toggleChannel(id) {
    setForm((f) => {
      const has = f.channels.includes(id);
      const next = has ? f.channels.filter((c) => c !== id) : [...f.channels, id];
      return { ...f, channels: next.length ? next : f.channels };
    });
  }

  function segmentPayload() {
    if (form.audience === "customers") return { role: "customer", label: "All customers" };
    if (form.audience === "vip") return { minSpend: 50000, label: "VIP customers" };
    if (form.audience === "repeat") return { minOrders: 1, label: "Repeat customers" };
    return { label: "All users" };
  }

  function buildBody(statusOverride) {
    const status = statusOverride || form.status || "draft";
    const channels = form.channels.length ? form.channels : ["email"];
    return {
      name: form.name.trim(),
      campaignType: form.campaignType,
      objective: form.objective,
      shortDescription: form.shortDescription.trim(),
      tags: form.tags,
      channel: channels[0],
      channels,
      segment: segmentPayload(),
      subject: form.subject.trim() || undefined,
      message: form.message.trim() || form.shortDescription.trim() || form.name.trim(),
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      timezone: form.timezone,
      totalBudget: form.totalBudget === "" ? undefined : Number(form.totalBudget),
      dailyBudget: form.dailyBudget === "" ? undefined : Number(form.dailyBudget),
      maxDiscount: form.maxDiscount === "" ? undefined : Number(form.maxDiscount),
      scheduledAt: startsAt || undefined,
      status: status === "active" || status === "sent" ? status : status === "scheduled" ? "scheduled" : "draft",
    };
  }

  async function save(statusOverride) {
    if (!form.name.trim()) {
      alert("Campaign name is required");
      setStep(0);
      return;
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      alert("End must be after start");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const body = buildBody(statusOverride);
      if (isEdit) await campaignsApi.update(id, body);
      else await campaignsApi.create(body);
      navigate("/marketing");
    } catch (e) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function launch() {
    if (!form.channels.length) {
      alert("Select at least one channel");
      setStep(2);
      return;
    }
    if (!form.message.trim() && !form.shortDescription.trim()) {
      alert("Add campaign content or a short description");
      setStep(3);
      return;
    }
    await save(startsAt && new Date(startsAt) > new Date() ? "scheduled" : "active");
  }

  if (isEdit && existing.loading && !existing.data) {
    return <LoadingState label="Loading campaign…" />;
  }
  if (isEdit && existing.error && !existing.data) {
    return <ErrorState message={existing.error} onRetry={existing.reload} />;
  }

  const previewTitle = form.name.trim() || "SUMMER SALE";
  const previewDiscount = form.maxDiscount ? `UP TO ${form.maxDiscount}% OFF` : "UP TO 50% OFF";
  const audienceLabel =
    form.audience === "vip"
      ? "VIP customers"
      : form.audience === "repeat"
        ? "Repeat customers"
        : form.audience === "customers"
          ? "All customers"
          : "All users";

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <nav className="text-xs text-muted mb-1.5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-muted">Marketing</span>
            <span>/</span>
            <Link to="/marketing" className="hover:text-primary">
              Campaigns
            </Link>
            <span>/</span>
            <span className="text-ink">{isEdit ? "Edit Campaign" : "New Campaign"}</span>
          </nav>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? "Edit Campaign" : "Create New Campaign"}
          </h1>
          <p className="text-sm text-muted mt-1">
            Plan, schedule, and launch a multi-channel marketing campaign.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/marketing")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={() => save("draft")} disabled={saving}>
            <Save size={14} /> Save as Draft
          </Button>
          <Button type="button" onClick={launch} disabled={saving}>
            <Rocket size={14} /> {saving ? "Saving…" : "Launch Campaign"}
          </Button>
        </div>
      </div>

      <Stepper step={step} onChange={setStep} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 flex flex-col gap-4">
          {step === 0 && (
            <>
              <SectionCard number={1} title="Campaign Information">
                <FormField>
                  <div className="flex items-center justify-between">
                    <Label required>Campaign Name</Label>
                    <span className="text-[11px] text-muted">
                      {form.name.length}/{NAME_MAX}
                    </span>
                  </div>
                  <input
                    className={inputCls}
                    maxLength={NAME_MAX}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Summer Sale 2025"
                  />
                </FormField>
                <FormField>
                  <Label required>Campaign Type</Label>
                  <select
                    className={inputCls}
                    value={form.campaignType}
                    onChange={(e) => set("campaignType", e.target.value)}
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label required>Campaign Objective</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {OBJECTIVES.map((obj) => {
                      const selected = form.objective === obj.id;
                      const Icon = obj.icon;
                      return (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => set("objective", obj.id)}
                          className={clsx(
                            "text-left rounded-lg border p-3 transition-colors",
                            selected
                              ? "border-primary bg-primary-light/50 ring-1 ring-primary/30"
                              : "border-border hover:border-primary/40 bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-md flex items-center justify-center",
                                selected ? "bg-primary text-white" : "bg-bg text-muted"
                              )}
                            >
                              <Icon size={15} />
                            </div>
                            <span
                              className={clsx(
                                "w-4 h-4 rounded-full border flex items-center justify-center",
                                selected ? "border-primary bg-primary" : "border-border"
                              )}
                            >
                              {selected && <Check size={10} className="text-white" />}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-ink">{obj.label}</div>
                          <div className="text-[11px] text-muted mt-0.5">{obj.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </FormField>
                <FormField>
                  <div className="flex items-center justify-between">
                    <Label>Short Description</Label>
                    <span className="text-[11px] text-muted">
                      {form.shortDescription.length}/{SHORT_MAX}
                    </span>
                  </div>
                  <textarea
                    className={inputCls}
                    rows={3}
                    maxLength={SHORT_MAX}
                    value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    placeholder="Brief campaign summary for your team"
                  />
                </FormField>
                <FormField className="mb-0">
                  <div className="flex items-center justify-between">
                    <Label>Campaign Tags (Optional)</Label>
                    <span className="text-[11px] text-muted">
                      {form.tags.length}/{TAGS_MAX}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg border border-border text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                          className="text-muted hover:text-danger"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    className={inputCls}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="summer, sale, electronics"
                    disabled={form.tags.length >= TAGS_MAX}
                  />
                  <p className="text-[11px] text-muted mt-1">Press Enter to add tags</p>
                </FormField>
              </SectionCard>

              <SectionCard number={2} title="Schedule">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField>
                    <Label required>Start Date</Label>
                    <input
                      type="date"
                      className={inputCls}
                      value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                    />
                  </FormField>
                  <FormField>
                    <Label required>Start Time</Label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.startTime}
                      onChange={(e) => set("startTime", e.target.value)}
                    />
                  </FormField>
                  <FormField>
                    <Label required>End Date</Label>
                    <input
                      type="date"
                      className={inputCls}
                      value={form.endDate}
                      onChange={(e) => set("endDate", e.target.value)}
                    />
                  </FormField>
                  <FormField>
                    <Label required>End Time</Label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.endTime}
                      onChange={(e) => set("endTime", e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField>
                    <Label>Timezone</Label>
                    <select
                      className={inputCls}
                      value={form.timezone}
                      onChange={(e) => set("timezone", e.target.value)}
                    >
                      <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                      <option value="UTC">(GMT+00:00) UTC</option>
                      <option value="Asia/Dubai">(GMT+04:00) Asia/Dubai</option>
                      <option value="America/New_York">(GMT-05:00) America/New_York</option>
                    </select>
                  </FormField>
                  <FormField>
                    <Label>Campaign Duration</Label>
                    <input className={inputCls} value={durationLabel} readOnly />
                  </FormField>
                </div>
              </SectionCard>

              <SectionCard number={3} title="Budget & Limits">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField>
                    <Label>Total Budget (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                      <input
                        type="number"
                        min="0"
                        className={clsx(inputCls, "pl-7")}
                        value={form.totalBudget}
                        onChange={(e) => set("totalBudget", e.target.value)}
                        placeholder="10000.00"
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">Leave empty for unlimited budget.</p>
                  </FormField>
                  <FormField>
                    <Label>Daily Budget (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                      <input
                        type="number"
                        min="0"
                        className={clsx(inputCls, "pl-7")}
                        value={form.dailyBudget}
                        onChange={(e) => set("dailyBudget", e.target.value)}
                        placeholder="2000.00"
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">Maximum amount per day.</p>
                  </FormField>
                  <FormField>
                    <Label>Maximum Discount (Optional)</Label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className={clsx(inputCls, "pr-8")}
                        value={form.maxDiscount}
                        onChange={(e) => set("maxDiscount", e.target.value)}
                        placeholder="20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">Maximum discount allowed in this campaign.</p>
                  </FormField>
                </div>
              </SectionCard>
            </>
          )}

          {step === 1 && (
            <SectionCard number={1} title="Audience">
              <Label required>Who should receive this campaign?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                {[
                  { value: "all", label: "All users", desc: "Everyone in your store" },
                  { value: "customers", label: "All customers", desc: "Registered customers only" },
                  { value: "vip", label: "VIP customers", desc: "Spend ≥ ₹50,000" },
                  { value: "repeat", label: "Repeat customers", desc: "1+ previous orders" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={clsx(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer",
                      form.audience === opt.value
                        ? "border-primary bg-primary-light/40"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={form.audience === opt.value}
                      onChange={() => set("audience", opt.value)}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                      <span className="block text-[11px] text-muted">{opt.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </SectionCard>
          )}

          {step === 2 && (
            <SectionCard number={1} title="Channels">
              <Label required>Select delivery channels</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {CHANNEL_OPTIONS.map((ch) => {
                  const selected = form.channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={clsx(
                        "text-left rounded-lg border p-3",
                        selected ? "border-primary bg-primary-light/40" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-ink">{ch.label}</span>
                        <span
                          className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            selected ? "bg-primary border-primary" : "border-border"
                          )}
                        >
                          {selected && <Check size={10} className="text-white" />}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">{ch.desc}</div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {step === 3 && (
            <SectionCard number={1} title="Content">
              {form.channels.includes("email") && (
                <FormField>
                  <Label>Email Subject</Label>
                  <input
                    className={inputCls}
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    placeholder="Don't miss our Summer Sale — up to 50% off"
                  />
                </FormField>
              )}
              <FormField className="mb-0">
                <Label required>Message / Body</Label>
                <textarea
                  className={inputCls}
                  rows={8}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Write the campaign message customers will see…"
                />
              </FormField>
            </SectionCard>
          )}

          {step === 4 && (
            <SectionCard number={1} title="Review & Launch">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Name", form.name || "—"],
                  ["Type", TYPE_LABELS[form.campaignType]],
                  ["Objective", OBJECTIVE_LABELS[form.objective]],
                  ["Audience", audienceLabel],
                  ["Channels", form.channels.map((c) => c.toUpperCase()).join(", ") || "—"],
                  ["Duration", durationLabel],
                  ["Total Budget", form.totalBudget ? `₹${form.totalBudget}` : "Unlimited"],
                  ["Max Discount", form.maxDiscount ? `${form.maxDiscount}%` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border p-3">
                    <dt className="text-[11px] text-muted uppercase tracking-wide">{label}</dt>
                    <dd className="font-medium text-ink mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted mt-4">
                Click <span className="font-semibold text-ink">Launch Campaign</span> to schedule or activate
                this campaign.
              </p>
            </SectionCard>
          )}

          <div className="flex justify-between gap-2">
            <Button
              variant="secondary"
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={launch} disabled={saving}>
                <Rocket size={14} /> Launch Campaign
              </Button>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <SectionCard title="Campaign Preview">
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#3654FF] via-[#5B6CFF] to-[#8B5CF6] text-white p-5 relative min-h-[160px]">
              <div className="absolute right-3 top-4 flex gap-1.5 opacity-90">
                <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center">
                  <Target size={14} />
                </div>
                <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center">
                  <Headphones size={14} />
                </div>
                <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center">
                  <Watch size={14} />
                </div>
              </div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-white/80 mb-1">
                Campaign Preview
              </div>
              <div className="font-display text-xl font-bold leading-tight mb-1 line-clamp-2 uppercase">
                {previewTitle}
              </div>
              <div className="text-sm font-semibold text-amber-200 mb-3">{previewDiscount}</div>
              <button
                type="button"
                className="text-[11px] font-bold bg-amber-300 text-ink px-3 py-1.5 rounded-md"
              >
                SHOP NOW
              </button>
              <div className="flex gap-1 mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Campaign Summary">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Campaign Type", TYPE_LABELS[form.campaignType] || "—"],
                ["Objective", OBJECTIVE_LABELS[form.objective] || "—"],
                ["Duration", durationLabel],
                ["Audience", audienceLabel],
                ["Channels", form.channels.length ? form.channels.join(", ") : "—"],
                ["Budget", form.totalBudget ? `₹${form.totalBudget}` : "—"],
                ["Daily Budget", form.dailyBudget ? `₹${form.dailyBudget}` : "—"],
                ["Max Discount", form.maxDiscount ? `${form.maxDiscount}%` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink text-right capitalize">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone="amber">Draft</Badge>
                </dd>
              </div>
            </dl>
          </SectionCard>

          <Card className="p-5 bg-primary-light/40 border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-primary" />
              <h2 className="font-display font-semibold text-ink text-[15px]">Tips</h2>
            </div>
            <ul className="space-y-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-muted">
                  <Check size={14} className="text-success mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
