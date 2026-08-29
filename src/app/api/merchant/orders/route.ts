import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Branch from "@/models/Branch";
import Order, { type OrderStatus } from "@/models/Order";

export interface KanbanOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  branchId: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    optionsSelected: string[];
  }>;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
  deliveryInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_KANBAN_ORDERS: KanbanOrder[] = [
  {
    _id: "ord-kanban-101",
    orderNumber: "#FG-89241",
    customerName: "Chinedu Okafor",
    customerPhone: "+234 803 123 4567",
    branchId: "65b002222222222222222201",
    items: [
      {
        title: "Crispy Fried Chicken (2 Pcs) & Chips",
        quantity: 2,
        unitPrice: 4800,
        optionsSelected: ["Spicy Pepper Sauce", "Extra Coleslaw"],
      },
      {
        title: "Chilled Chapman (50cl)",
        quantity: 1,
        unitPrice: 1500,
        optionsSelected: ["Regular Crushed Ice"],
      },
    ],
    subtotal: 11100,
    deliveryFee: 700,
    totalAmount: 11800,
    status: "PLACED",
    paymentStatus: "PAID",
    deliveryInstructions: "Please pack extra napkins and hot sauce.",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    _id: "ord-kanban-102",
    orderNumber: "#FG-89242",
    customerName: "Folake Adeleke",
    customerPhone: "+234 814 987 6543",
    branchId: "65b002222222222222222201",
    items: [
      {
        title: "Double Beef Cheese Burger Deluxe",
        quantity: 1,
        unitPrice: 4500,
        optionsSelected: ["Toasted Brioche Bun", "Smoky BBQ Sauce", "Add Extra Cheddar Slice"],
      },
      {
        title: "Freshly Squeezed Citrus Lemonade",
        quantity: 1,
        unitPrice: 1800,
        optionsSelected: ["Less Ice"],
      },
    ],
    subtotal: 6900,
    deliveryFee: 650,
    totalAmount: 7550,
    status: "PLACED",
    paymentStatus: "PAID",
    deliveryInstructions: "Call when rider is at the gate.",
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    _id: "ord-kanban-103",
    orderNumber: "#FG-89240",
    customerName: "Amina Bello",
    customerPhone: "+234 809 456 7890",
    branchId: "65b002222222222222222201",
    items: [
      {
        title: "Smoky Jollof Rice Special with Grilled Chicken",
        quantity: 1,
        unitPrice: 5200,
        optionsSelected: ["Grilled Chicken Lap", "Fried Sweet Plantain (Dodo)", "Moimoi (Steamed Bean Cake)"],
      },
    ],
    subtotal: 6200,
    deliveryFee: 800,
    totalAmount: 7000,
    status: "PREPARING",
    paymentStatus: "PAID",
    deliveryInstructions: "Ensure chicken is very well done.",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    _id: "ord-kanban-104",
    orderNumber: "#FG-89239",
    customerName: "Tunde Bakare",
    customerPhone: "+234 703 234 5678",
    branchId: "65b002222222222222222201",
    items: [
      {
        title: "Special Fried Rice & Peppered Gizzard",
        quantity: 2,
        unitPrice: 4900,
        optionsSelected: ["Peppered Chicken Wing (2pcs)"],
      },
      {
        title: "Chilled Chapman (50cl)",
        quantity: 2,
        unitPrice: 1500,
        optionsSelected: [],
      },
    ],
    subtotal: 12800,
    deliveryFee: 700,
    totalAmount: 13500,
    status: "READY",
    paymentStatus: "PAID",
    deliveryInstructions: "Rider ID: RD-402 heading to restaurant.",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let branchId = session.user.activeBranchId;

    try {
      await connectToDatabase();

      if (!branchId) {
        const firstBranch = await Branch.findOne({}).lean();
        if (firstBranch) {
          branchId = String(firstBranch._id);
        }
      }

      if (branchId) {
        const dbOrders = await Order.find({ branchId })
          .sort({ createdAt: -1 })
          .populate("customerId", "name email phone")
          .lean();

        if (dbOrders && dbOrders.length > 0) {
          const formattedOrders: KanbanOrder[] = dbOrders.map((o) => {
            const cust = o.customerId as unknown as { name?: string; phone?: string } | null;
            return {
              _id: String(o._id),
              orderNumber: o.orderNumber,
              customerName: cust?.name || "Customer",
              customerPhone: cust?.phone || o.deliveryAddress?.phone || "+234 800 000 0000",
              branchId: String(o.branchId),
              items: (o.items as Array<{ title: string; quantity: number; unitPrice: number; optionsSelected?: string[] }>).map((it) => ({
                title: it.title,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                optionsSelected: it.optionsSelected || [],
              })),
              subtotal: o.subtotal,
              deliveryFee: o.deliveryFee,
              totalAmount: o.totalAmount,
              status: o.status as OrderStatus,
              paymentStatus: o.paymentStatus,
              deliveryInstructions: o.deliveryAddress?.deliveryInstructions || o.deliveryAddress?.landmark || "",
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt ? o.updatedAt.toISOString() : o.createdAt.toISOString(),
            };
          });

          return NextResponse.json({
            success: true,
            branchId,
            orders: formattedOrders,
          });
        }
      }
    } catch (dbErr) {
      console.warn("DB orders fetch fallback", dbErr);
    }

    return NextResponse.json({
      success: true,
      branchId: branchId || "65b002222222222222222201",
      orders: MOCK_KANBAN_ORDERS,
    });
  } catch (error) {
    console.error("Merchant orders API error", error);
    return NextResponse.json({ error: "Failed to fetch merchant orders" }, { status: 500 });
  }
}
