import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import "./StudyPlan.css";

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

function StudyPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [form, setForm] = useState({
    title: "",
    subject: "",
    date: today(),
    duration: "60",
    priority: "Medium",
  });

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/study-plans");
      setPlans(response.data.plans || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your study plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const addPlan = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.subject.trim()) {
      setError("Enter a task title and subject.");
      return;
    }

    try {
      const response = await API.post("/study-plans", {
        ...form,
        duration: Number(form.duration),
      });
      setPlans((previous) =>
        [...previous, response.data.plan].sort((a, b) => a.date.localeCompare(b.date))
      );
      setForm({
        title: "",
        subject: "",
        date: today(),
        duration: "60",
        priority: "Medium",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the study task.");
    }
  };

  const togglePlan = async (plan) => {
    try {
      const response = await API.patch(`/study-plans/${plan._id}`, {
        completed: !plan.completed,
      });
      setPlans((previous) =>
        previous.map((item) => (item._id === plan._id ? response.data.plan : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not update the task.");
    }
  };

  const removePlan = async (plan) => {
    try {
      await API.delete(`/study-plans/${plan._id}`);
      setPlans((previous) => previous.filter((item) => item._id !== plan._id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the task.");
    }
  };

  const visiblePlans = useMemo(() => {
    if (filter === "completed") return plans.filter((plan) => plan.completed);
    if (filter === "upcoming") {
      return plans.filter((plan) => !plan.completed && plan.date >= today());
    }
    return plans;
  }, [plans, filter]);

  const completedCount = plans.filter((plan) => plan.completed).length;
  const totalMinutes = plans
    .filter((plan) => !plan.completed)
    .reduce((total, plan) => total + plan.duration, 0);
  const progress = plans.length
    ? Math.round((completedCount / plans.length) * 100)
    : 0;

  return (
    <main className="sp-page">
      <header className="sp-header">
        <div>
          <p className="sp-eyebrow">PERSONAL SCHEDULE</p>
          <h1>📅 Study Plan</h1>
          <p>Turn your exam goals into focused daily tasks.</p>
        </div>
      </header>

      {error && <div className="sp-error" role="alert">{error}</div>}

      <section className="sp-stats">
        <div><strong>{plans.length}</strong><span>Total tasks</span></div>
        <div><strong>{completedCount}</strong><span>Completed</span></div>
        <div><strong>{Math.round(totalMinutes / 60 * 10) / 10}h</strong><span>Remaining</span></div>
        <div><strong>{progress}%</strong><span>Progress</span></div>
      </section>

      <section className="sp-layout">
        <form className="sp-form" onSubmit={addPlan}>
          <h2>Add study task</h2>
          <label>
            Task
            <input name="title" value={form.title} onChange={updateField} placeholder="Revise DBMS joins" />
          </label>
          <label>
            Subject
            <input name="subject" value={form.subject} onChange={updateField} placeholder="Database Management" />
          </label>
          <div className="sp-form-grid">
            <label>
              Date
              <input name="date" type="date" value={form.date} onChange={updateField} />
            </label>
            <label>
              Minutes
              <input name="duration" type="number" min="5" max="480" value={form.duration} onChange={updateField} />
            </label>
          </div>
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={updateField}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
          <button type="submit" className="sp-add">＋ Add to plan</button>
        </form>

        <div className="sp-tasks">
          <div className="sp-task-head">
            <h2>My tasks</h2>
            <div className="sp-filters" aria-label="Filter study tasks">
              {["upcoming", "completed", "all"].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading && <div className="sp-empty">Loading your plan...</div>}

          {!loading && visiblePlans.length === 0 && (
            <div className="sp-empty">
              <span>📚</span>
              <h3>No tasks here</h3>
              <p>Add a task or change the filter.</p>
            </div>
          )}

          <div className="sp-list">
            {visiblePlans.map((plan) => (
              <article className={`sp-task ${plan.completed ? "completed" : ""}`} key={plan._id}>
                <button
                  type="button"
                  className="sp-check"
                  onClick={() => togglePlan(plan)}
                  aria-label={plan.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {plan.completed ? "✓" : ""}
                </button>
                <div className="sp-task-info">
                  <h3>{plan.title}</h3>
                  <p>{plan.subject} · {formatDate(plan.date)} · {plan.duration} min</p>
                </div>
                <span className={`sp-priority sp-${plan.priority.toLowerCase()}`}>{plan.priority}</span>
                <button type="button" className="sp-delete" onClick={() => removePlan(plan)} aria-label={`Delete ${plan.title}`}>×</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default StudyPlan;
