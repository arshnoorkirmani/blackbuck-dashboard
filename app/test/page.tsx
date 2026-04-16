"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RowData = string[];

export default function TestPage() {
    const [url, setUrl] = React.useState("");
    const [tabs, setTabs] = React.useState<string[]>([]);
    const [selectedTab, setSelectedTab] = React.useState<string>("");
    const [data, setData] = React.useState<RowData[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [tabsLoading, setTabsLoading] = React.useState(false);
    const [dataLoading, setDataLoading] = React.useState(false);

    const handleLoadTabs = async () => {
        setTabsLoading(true);
        setError(null);
        setTabs([]);
        setSelectedTab("");
        setData(null);

        try {
            const res = await fetch("/api/fetch-sheet-tabs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to load tabs");
            setTabs(json.tabs);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load tabs");
        } finally {
            setTabsLoading(false);
        }
    };

    const handleFetchData = async (tab: string) => {
        setSelectedTab(tab);
        setDataLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch("/api/fetch-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, tab }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to fetch data");
            setData(json.data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to fetch data");
        } finally {
            setDataLoading(false);
        }
    };

    const headers: RowData = data?.[0] ?? [];
    const rows: RowData[] = data?.slice(1) ?? [];

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.title}>Google Sheet Viewer</h1>

                <div style={styles.row}>
                    <Input
                        id="sheet-url-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste Google Sheet URL..."
                        style={styles.input}
                    />
                    <Button
                        id="load-tabs-btn"
                        onClick={handleLoadTabs}
                        disabled={tabsLoading || !url}
                        style={styles.primaryBtn}
                    >
                        {tabsLoading ? "Loading..." : "Load Tabs"}
                    </Button>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                {tabs.length > 0 && (
                    <div style={styles.tabSection}>
                        <p style={styles.label}>Select a sheet tab:</p>
                        <div style={styles.tabList}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    id={`tab-${tab.replace(/\s+/g, "-")}`}
                                    onClick={() => handleFetchData(tab)}
                                    style={{
                                        ...styles.tabChip,
                                        ...(selectedTab === tab ? styles.tabChipActive : {}),
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {dataLoading && (
                    <div style={styles.statusMsg}>
                        Fetching data from &quot;{selectedTab}&quot;...
                    </div>
                )}

                {data && !dataLoading && (
                    <div style={styles.tableWrapper}>
                        <p style={styles.label}>
                            Showing <strong>{rows.length}</strong> rows from <strong>{selectedTab}</strong>
                        </p>
                        <div style={styles.tableScroll}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ ...styles.th, ...styles.indexCol }}>#</th>
                                        {headers.map((h, i) => (
                                            <th key={i} style={styles.th}>{h || `Col ${i + 1}`}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, ri) => (
                                        <tr key={ri} style={ri % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                                            <td style={{ ...styles.td, ...styles.indexCol }}>{ri + 1}</td>
                                            {headers.map((_, ci) => (
                                                <td key={ci} style={styles.td}>{row[ci] ?? ""}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#0f1117",
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
    },
    card: {
        width: "100%",
        maxWidth: 1100,
        background: "#1a1d27",
        borderRadius: 16,
        border: "1px solid #2d3148",
        padding: "36px 32px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 24,
        color: "#f1f5f9",
    },
    row: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 16,
    },
    input: {
        flex: 1,
        background: "#0f1117",
        border: "1px solid #2d3148",
        color: "#e2e8f0",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 14,
    },
    primaryBtn: {
        background: "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontSize: 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    error: {
        background: "#2d1b1b",
        border: "1px solid #7f1d1d",
        color: "#fca5a5",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 16,
        fontSize: 14,
    },
    tabSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        color: "#94a3b8",
        marginBottom: 10,
    },
    tabList: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
    },
    tabChip: {
        background: "#0f1117",
        border: "1px solid #2d3148",
        borderRadius: 20,
        color: "#cbd5e1",
        padding: "6px 16px",
        fontSize: 13,
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    tabChipActive: {
        background: "#4f46e5",
        borderColor: "#4f46e5",
        color: "#fff",
        fontWeight: 600,
    },
    statusMsg: {
        color: "#94a3b8",
        fontSize: 14,
        marginBottom: 16,
    },
    tableWrapper: {
        marginTop: 8,
    },
    tableScroll: {
        overflowX: "auto",
        borderRadius: 10,
        border: "1px solid #2d3148",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
        minWidth: 600,
    },
    th: {
        background: "#0f1117",
        color: "#94a3b8",
        padding: "10px 14px",
        textAlign: "left",
        borderBottom: "1px solid #2d3148",
        fontWeight: 600,
        whiteSpace: "nowrap",
    },
    td: {
        padding: "8px 14px",
        borderBottom: "1px solid #1e2235",
        color: "#e2e8f0",
        whiteSpace: "nowrap",
    },
    rowEven: { background: "#1a1d27" },
    rowOdd: { background: "#1e2235" },
    indexCol: {
        color: "#475569",
        width: 44,
        textAlign: "center",
        fontSize: 12,
    },
};
