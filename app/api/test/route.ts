import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserConfig from "@/lib/models/UserConfig";
import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/types/dashboard";
import { getSheetData } from "@/lib/google";
import type { UserRole, DashboardConfig } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        // ── 1. Authentication Check ────────────────────────────────────────────────
        const session = await auth();
        if (!session?.accessToken) {
            return NextResponse.json({ error: "Unauthorized — please sign in." }, { status: 401 });
        }

        const userEmail = session.user?.email?.toLowerCase() ?? "";
        let role: UserRole = (session.role as UserRole) ?? "AGENT";

        // ── 2. Database & Config ───────────────────────────────────────────────────
        await dbConnect();
        const configRecord = await UserConfig.findOne({ email: "__dashboard__" });
        const config: DashboardConfig = configRecord?.config ?? DEFAULT_DASHBOARD_CONFIG;

        if (!config.sheetUrl) {
            return NextResponse.json({ error: "Dashboard not configured." }, { status: 503 });
        }

        const match = config.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const sheetId = match?.[1];
        if (!sheetId) return NextResponse.json({ error: "Invalid Sheet URL." }, { status: 500 });

        // ── 3. Fetch All Raw Data (Parallel) ────────────────────────────────────────
        const sheetsBase = [
            getSheetData(session.accessToken, sheetId, config.tabs.agent),
            getSheetData(session.accessToken, sheetId, config.tabs.tl),
            getSheetData(session.accessToken, sheetId, config.tabs.rawSales),
            getSheetData(session.accessToken, sheetId, config.tabs.teleSales),
            getSheetData(session.accessToken, sheetId, config.tabs.incentive),
            getSheetData(session.accessToken, sheetId, config.tabs.appraisal)
        ];

        const [agentRaw, tlRaw, rawSalesRaw, teleSalesRaw, incentiveRaw, appraisalRaw] = await Promise.all(sheetsBase);

        // ── 4. Modular Data Processing Pipeline ─────────────────────────────────────
        // (Aap in functions ko alag folders me bana sakte ho, yaha clear samajhne ke liye flow banaya h)

        // Step A: Har agent ka ek comprehensive Profile/Object banaye
        const agentsMap = buildAgentProfiles(agentRaw, incentiveRaw, appraisalRaw);

        // Step B: Sales filter karein aur Agent objects me daale (Today, Yesterday, 10k, 50k etc)
        processAndMapSales(agentsMap, rawSalesRaw, teleSalesRaw);

        // Step C: Agents ko TL ke according Group karke "Team" Object banaye
        const teamsList = groupAgentsIntoTeams(agentsMap, tlRaw);

        // Step D: Global Analytics Generate Karein saari teams ka data mila kar
        const globalAnalytics = extractGlobalAnalytics(teamsList);

        // Final payload structure
        const fullData = {
            analytics: globalAnalytics, // Global data for Analytics page
            teams: teamsList,           // For Team Page (Nested agents inside)
            agents: Array.from(agentsMap.values()), // Array of all agents
        };

        // ── 5. Filtering according to User Role & View ───────────────────────────────
        const { searchParams } = req.nextUrl;
        const view = searchParams.get("view");

        // Role Resolution Logic...
        if (role !== "ADMIN") {
            // Basic example of dynamic role resolution 
            // (You can use your old resolveTLNames function here)
            const tlMatch = teamsList.find(t => t.managerEmail === userEmail);
            if (tlMatch) {
                role = "TL";
            }
        }

        let responseData = fullData;

        // Agar view analytics hai aur permission hai, toh sab data do
        if (view !== "analytics" && role !== "ADMIN") {
            // Apply filtering:
            // Agar TL hai toh sirf uski team ka data.
            // Agar Agent hai toh sirf uska khudka data under 'teams' mock structure.
            responseData = applyRoleBasedSecurityFilters(fullData, role, userEmail);
        }

        // ── 6. Return Data ────────────────────────────────────────────────────────
        return NextResponse.json({
            data: responseData,
            role,
            meta: {
                fetchedAt: new Date().toISOString(),
                totalAgentsParsed: agentsMap.size,
                totalTeams: teamsList.length
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ============================================================================
// DUMMY IMPLEMENTATION SIGNATURES (Yeh aapke 'lib/aggregators' ya 'parsers' me jayenge)
// ============================================================================

function buildAgentProfiles(agentRaw: any, incentiveRaw: any, appraisalRaw: any): Map<string, any> {
    const agentsMap = new Map<string, any>();
    // Loop through agentRaw and init the massive object:
    // { empId, name, email, saleCode, targets, status ... dailyStats: {}, customers: [] }
    return agentsMap;
}

function processAndMapSales(agentsMap: Map<string, any>, rawSalesRaw: any, teleSalesRaw: any) {
    // Loop through sales.
    // Calculate 10k, 50k transactions.
    // Check Date (Today, Yesterday, etc.)
    // Find the correct agent in agentsMap based on sale code.
    // Push the sale object to the agent's customers array.
    // Update agent's totalSalesToday, totalSalesYesterday, etc.
}

function groupAgentsIntoTeams(agentsMap: Map<string, any>, tlRaw: any): any[] {
    const teams = new Map<string, any>();
    // Loop mapping agents to their TL
    // Returns array of Team objects, eg:
    // [ { teamId: "TL_1", tlName: "Sangam Sanjay", teamSales: 250, agents: [{...}, {...}] } ]
    return Array.from(teams.values());
}

function extractGlobalAnalytics(teamsList: any[]): any {
    // Sum all team data to create the global stats
    return {
        totalSales: 200,
        highValueCustomers: 20, /* >50k transactions overall */
        dailyTrends: {}
    };
}

function applyRoleBasedSecurityFilters(fullData: any, role: string, userEmail: string): any {
    // Filter data logic according to Role (TL vs Agent)
    return fullData;
}
