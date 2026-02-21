import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Send initial state
      const casosActivos = await prisma.caso.count({
        where: {
          estado: { in: ["nuevo", "asignado", "en_curso", "escalado"] },
        },
      });
      sendEvent({ type: "init", casosActivos });

      // Poll for updates every 3 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const recentCases = await prisma.caso.findMany({
            where: {
              updatedAt: {
                gte: new Date(Date.now() - 5000),
              },
            },
            include: { agente: true },
            orderBy: { updatedAt: "desc" },
            take: 10,
          });

          if (recentCases.length > 0) {
            sendEvent({ type: "update", casos: recentCases });
          }

          const activos = await prisma.caso.count({
            where: {
              estado: { in: ["nuevo", "asignado", "en_curso", "escalado"] },
            },
          });
          sendEvent({ type: "heartbeat", casosActivos: activos, timestamp: new Date().toISOString() });
        } catch {
          // Ignore errors during polling
        }
      }, 3000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }, 300000);
    },
    cancel() {
      closed = true;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
