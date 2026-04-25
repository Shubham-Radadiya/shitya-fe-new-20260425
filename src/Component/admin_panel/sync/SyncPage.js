import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import syncServices from "../../../services/sync.services";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import "./index.css";

function statusClass(status, pendingCount) {
  if (status === "error") return "sync-badge sync-badge--error";
  if (pendingCount > 0) return "sync-badge sync-badge--warn";
  return "sync-badge sync-badge--ok";
}

function completionClass(status) {
  return status === "completed"
    ? "sync-badge sync-badge--ok"
    : "sync-badge sync-badge--warn";
}

export default function SyncPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        const res = await syncServices.getSyncReport();
        setData(res.data || null);
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Failed to load sync report"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const summary = useMemo(() => {
    const collections = Array.isArray(data?.collections) ? data.collections : [];
    return {
      totalPending: collections.reduce(
        (s, c) => s + (Number(c.pendingCount) || 0),
        0
      ),
      pendingUsers: Array.isArray(data?.pendingUsers) ? data.pendingUsers.length : 0,
      pendingBranches: Array.isArray(data?.pendingBranches)
        ? data.pendingBranches.length
        : 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="sync-page">
        <div className="sync-page__card">Loading sync report...</div>
      </div>
    );
  }

  return (
    <div className="sync-page">
      <div className="sync-page__head">
        <div>
          <h2 className="sync-page__title">Sync Report</h2>
          <p className="sync-page__subtitle">
            Branch: <strong>{data?.branchCode || "N/A"}</strong> | Last refresh:{" "}
            {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}
          </p>
          <p className="sync-page__subtitle">
            Report date:{" "}
            <strong>
              {data?.reportDate
                ? new Date(data.reportDate).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </strong>
          </p>
        </div>
        <button
          type="button"
          className="sync-page__refresh"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="sync-kpis">
        <div className="sync-kpi sync-kpi--warn">
          <div className="sync-kpi__label">Pending docs</div>
          <div className="sync-kpi__value">{summary.totalPending}</div>
        </div>
        <div className="sync-kpi sync-kpi--warn">
          <div className="sync-kpi__label">Users with pending sync</div>
          <div className="sync-kpi__value">{summary.pendingUsers}</div>
        </div>
        <div className="sync-kpi sync-kpi--ok">
          <div className="sync-kpi__label">Branches with pending sync</div>
          <div className="sync-kpi__value">{summary.pendingBranches}</div>
        </div>
      </div>

      <div className="sync-grid-2">
        <div className="sync-page__card">
          <h3 className="sync-section__title">Pending by user</h3>
          <div className="sync-table-wrap">
            <table className="sync-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Branch</th>
                  <th>Total pending</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pendingUsers || []).length === 0 ? (
                  <tr>
                    <td colSpan={3}>No pending users.</td>
                  </tr>
                ) : (
                  (data?.pendingUsers || []).map((u) => (
                    <tr key={u.userId}>
                      <td>{u.fullName || u.userName}</td>
                      <td>{u.branchName}</td>
                      <td className={u.pendingTotal > 0 ? "sync-num--warn" : ""}>
                        {u.pendingTotal}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sync-page__card">
          <h3 className="sync-section__title">Pending by branch</h3>
          <div className="sync-table-wrap">
            <table className="sync-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Users pending</th>
                  <th>Docs pending</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pendingBranches || []).length === 0 ? (
                  <tr>
                    <td colSpan={3}>No pending branches.</td>
                  </tr>
                ) : (
                  (data?.pendingBranches || []).map((b) => (
                    <tr key={b.branchName}>
                      <td>{b.branchName}</td>
                      <td>{b.users}</td>
                      <td className={b.pendingTotal > 0 ? "sync-num--warn" : ""}>
                        {b.pendingTotal}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sync-grid-2">
        <div className="sync-page__card">
          <h3 className="sync-section__title">Today sync by user</h3>
          <div className="sync-table-wrap">
            <table className="sync-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Branch</th>
                  <th>Synced today</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.syncedTodayUsers || []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>No sync activity for current date.</td>
                  </tr>
                ) : (
                  (data?.syncedTodayUsers || []).map((u) => (
                    <tr key={`today-${u.userId}`}>
                      <td>{u.fullName || u.userName}</td>
                      <td>{u.branchName}</td>
                      <td>{u.todaySyncedCount}</td>
                      <td>
                        <span className={completionClass(u.status)}>{u.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sync-page__card">
          <h3 className="sync-section__title">Today sync by branch</h3>
          <div className="sync-table-wrap">
            <table className="sync-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Users active</th>
                  <th>Synced today</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.syncedTodayBranches || []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>No branch sync activity for current date.</td>
                  </tr>
                ) : (
                  (data?.syncedTodayBranches || []).map((b) => (
                    <tr key={`today-branch-${b.branchName}`}>
                      <td>{b.branchName}</td>
                      <td>{b.users}</td>
                      <td>{b.todaySyncedCount}</td>
                      <td>
                        <span className={completionClass(b.status)}>{b.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

