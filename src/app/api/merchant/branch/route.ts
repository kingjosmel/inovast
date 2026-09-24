import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Branch from "@/models/Branch";

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { branchId, isOpen } = body;

    if (typeof isOpen !== "boolean") {
      return NextResponse.json({ error: "isOpen boolean status is required" }, { status: 400 });
    }

    const targetBranchId = branchId || session.user.activeBranchId;
    if (!targetBranchId || !isValidObjectId(targetBranchId)) {
      return NextResponse.json({ error: "A valid branch ID is required" }, { status: 400 });
    }

    if (session.user.role !== "SUPER_ADMIN" && targetBranchId !== session.user.activeBranchId) {
      return NextResponse.json({ error: "Branch access denied" }, { status: 403 });
    }

    await connectToDatabase();
    const targetBranch = await Branch.findByIdAndUpdate(
      targetBranchId,
      { isOpen },
      { new: true },
    ).lean();

    if (!targetBranch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: String(targetBranch._id),
        name: targetBranch.name,
        isOpen: targetBranch.isOpen,
      },
    });
  } catch (error) {
    console.error("Failed to update branch status", error);
    return NextResponse.json({ error: "Failed to update store availability" }, { status: 500 });
  }
}
