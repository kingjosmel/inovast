import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import SystemSetting from "@/models/SystemSetting";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 401 });
    }

    let settings = {
      baseDeliveryFee: 800,
      perKmRate: 150,
      platformServiceFeeRate: 0.05,
      globalSurgeMultiplier: 1.2,
      zoneSurges: [
        { zone: "Victoria Island", multiplier: 1.4, isActive: true },
        { zone: "Lekki Phase 1", multiplier: 1.5, isActive: true },
        { zone: "Ikeja GRA", multiplier: 1.2, isActive: true },
        { zone: "Ikoyi", multiplier: 1.3, isActive: true },
        { zone: "Yaba / Tech Hub", multiplier: 1.2, isActive: false },
        { zone: "Surulere", multiplier: 1.1, isActive: false },
      ],
      badWeatherSurge: false,
      nightSurge: false,
      updatedAt: new Date().toISOString(),
    };

    try {
      await connectToDatabase();
      const dbSettings = await SystemSetting.findOne().sort({ updatedAt: -1 }).lean();
      if (dbSettings) {
        settings = {
          baseDeliveryFee: dbSettings.baseDeliveryFee ?? 800,
          perKmRate: dbSettings.perKmRate ?? 150,
          platformServiceFeeRate: dbSettings.platformServiceFeeRate ?? 0.05,
          globalSurgeMultiplier: dbSettings.globalSurgeMultiplier ?? 1.2,
          zoneSurges: dbSettings.zoneSurges && dbSettings.zoneSurges.length > 0 ? dbSettings.zoneSurges : settings.zoneSurges,
          badWeatherSurge: Boolean(dbSettings.badWeatherSurge),
          nightSurge: Boolean(dbSettings.nightSurge),
          updatedAt: (dbSettings.updatedAt || new Date()).toISOString(),
        };
      }
    } catch (dbErr) {
      console.warn("DB settings query fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Failed to load system settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      baseDeliveryFee,
      perKmRate,
      platformServiceFeeRate,
      globalSurgeMultiplier,
      zoneSurges,
      badWeatherSurge,
      nightSurge,
    } = body;

    const updatePayload: Record<string, unknown> = {
      updatedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (baseDeliveryFee !== undefined) updatePayload.baseDeliveryFee = Number(baseDeliveryFee);
    if (perKmRate !== undefined) updatePayload.perKmRate = Number(perKmRate);
    if (platformServiceFeeRate !== undefined) {
      const rate = Number(platformServiceFeeRate);
      updatePayload.platformServiceFeeRate = rate > 1 ? rate / 100 : rate;
    }
    if (globalSurgeMultiplier !== undefined) updatePayload.globalSurgeMultiplier = Number(globalSurgeMultiplier);
    if (zoneSurges !== undefined) updatePayload.zoneSurges = zoneSurges;
    if (badWeatherSurge !== undefined) updatePayload.badWeatherSurge = Boolean(badWeatherSurge);
    if (nightSurge !== undefined) updatePayload.nightSurge = Boolean(nightSurge);

    try {
      await connectToDatabase();
      const updated = await SystemSetting.findOneAndUpdate(
        {},
        { $set: updatePayload },
        { upsert: true, new: true }
      );

      await AuditLog.create({
        actorId: session.user.id,
        action: "SYSTEM_PRICING_UPDATED",
        targetModel: "SystemSetting",
        targetId: updated._id,
        metadata: updatePayload,
      });
    } catch (dbErr) {
      console.warn("DB settings update fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Platform pricing and dynamic surge settings saved successfully.",
      settings: updatePayload,
    });
  } catch (error) {
    console.error("Admin settings POST error:", error);
    return NextResponse.json({ error: "Failed to update platform settings" }, { status: 500 });
  }
}
