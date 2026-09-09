package com.casalis.pos

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket
import kotlin.concurrent.thread

class PrinterBridge(private val context: Context) {

    private val prefs by lazy {
        context.getSharedPreferences("printer_config", Context.MODE_PRIVATE)
    }

    @JavascriptInterface
    fun print(jsonString: String) {
        thread {
            try {
                val data = JSONObject(jsonString)
                val bytes = generateEscPos(data)
                sendToPrinter(bytes)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun openCashDrawer() {
        thread {
            try {
                val cmd = byteArrayOf(0x1B, 0x70, 0x00, 0x10, 0x00)
                sendToPrinter(cmd)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun getPrinterIp(): String {
        return prefs.getString("printer_ip", "192.168.1.108") ?: "192.168.1.108"
    }

    @JavascriptInterface
    fun getPrinterPort(): Int {
        return prefs.getInt("printer_port", 9100)
    }

    private fun generateEscPos(data: JSONObject): ByteArray {
        val cmd = StringBuilder()

        // Initialize printer
        cmd.append("\u001B\u0040") // ESC @

        // Select code page CP1252 (supports €, é, í, á, etc.)
        cmd.append("\u001B\u0074\u0010") // ESC t 16 = CP1252

        // Store name (centered, bold)
        if (data.optBoolean("showStoreName", true)) {
            cmd.append("\u001B\u0061\u0001") // center align
            cmd.append("\u001B\u0045\u0001") // bold on
            cmd.append("\u001B\u0021\u0010") // double height
            cmd.append(data.optString("storeName", ""))
            cmd.append("\n")
            cmd.append("\u001B\u0021\u0000") // normal size
            cmd.append("\u001B\u0045\u0000") // bold off
        }

        // Custom header
        val ticketConfig = data.optJSONObject("ticketConfig")
        val customHeader = ticketConfig?.optString("customHeader")
        if (!customHeader.isNullOrEmpty()) {
            cmd.append("\u001B\u0061\u0001") // center align
            cmd.append("$customHeader\n")
        }

        // Date and time
        cmd.append("\u001B\u0061\u0001") // center align
        cmd.append("${data.optString("date", "")} ${data.optString("time", "")}\n")

        // Order number
        cmd.append("${data.optString("orderNumber", "")}\n")

        // Employee name
        val employeeName = data.optString("employeeName", "")
        if (employeeName.isNotEmpty()) {
            cmd.append("$employeeName\n")
        }

        // Separator
        val lineWidth = if (data.optString("ticketSize") == "80mm") 48 else 32
        cmd.append("-".repeat(lineWidth) + "\n")

        // Items (left align)
        cmd.append("\u001B\u0061\u0000") // left align
        val items = data.optJSONArray("items") ?: JSONArray()
        for (i in 0 until items.length()) {
            val item = items.getJSONObject(i)
            val name = item.optString("name", "")
            val qty = item.optInt("qty", 1)
            val price = item.optDouble("price", 0.0)
            val isGift = item.optBoolean("isGift", false)

            val displayName = if (isGift) "$name *" else name
            val line = "${displayName} x$qty"
            val priceStr = "\u20AC${"%.2f".format(price)}"
            val paddedLine = line.padEnd(lineWidth - priceStr.length)
            cmd.append("$paddedLine$priceStr\n")
        }

        // Separator
        cmd.append("-".repeat(lineWidth) + "\n")

        // Totals (only if not gift receipt)
        val isGiftReceipt = data.optBoolean("isGiftReceipt", false)
        if (!isGiftReceipt) {
            // Subtotal
            val subtotal = data.optDouble("subtotal", 0.0)
            val subtotalStr = "\u20AC${"%.2f".format(subtotal)}"
            cmd.append("Subtotal${subtotalStr.padStart(lineWidth - 8)}\n")

            // Discount
            val discount = data.optDouble("discount", 0.0)
            if (discount > 0) {
                val discountStr = "-\u20AC${"%.2f".format(discount)}"
                cmd.append("Descuento${discountStr.padStart(lineWidth - 10)}\n")
            }

            // Tax
            val taxLabel = data.optString("taxLabel", "")
            val tax = data.optDouble("tax", 0.0)
            val taxStr = "\u20AC${"%.2f".format(tax)}"
            cmd.append("$taxLabel${taxStr.padStart(lineWidth - taxLabel.length)}\n")

            // Total (bold)
            val total = data.optDouble("total", 0.0)
            val totalStr = "\u20AC${"%.2f".format(total)}"
            cmd.append("\u001B\u0045\u0001") // bold on
            cmd.append("TOTAL${totalStr.padStart(lineWidth - 5)}\n")
            cmd.append("\u001B\u0045\u0000") // bold off

            // Payment method
            val paymentMethod = data.optString("paymentMethod", "")
            cmd.append("Pago: $paymentMethod\n")

            // Amount received and change (cash only)
            if (paymentMethod == "Efectivo") {
                val amountReceived = data.optDouble("amountReceived", -1.0)
                if (amountReceived >= 0) {
                    cmd.append("Recibido: \u20AC${"%.2f".format(amountReceived)}\n")
                }
                val change = data.optDouble("change", -1.0)
                if (change >= 0) {
                    cmd.append("Cambio: \u20AC${"%.2f".format(change)}\n")
                }
            }

            // Loyalty points
            val pointsEarned = data.optInt("loyaltyPointsEarned", 0)
            if (pointsEarned > 0) {
                cmd.append("\u001B\u0061\u0001") // center
                cmd.append("Puntos ganados: +$pointsEarned\n")
            }

            val pointsRedeemed = data.optInt("loyaltyPointsRedeemed", 0)
            if (pointsRedeemed > 0) {
                cmd.append("\u001B\u0061\u0001") // center
                cmd.append("Puntos usados: -$pointsRedeemed\n")
            }
        }

        // Separator
        cmd.append("-".repeat(lineWidth) + "\n")

        // Footer
        cmd.append("\u001B\u0061\u0001") // center align
        val footer = data.optString("footer", "Gracias por su compra")
        cmd.append("$footer\n")

        // Feed paper before cutting
        cmd.append("\u001B\u0064\u0005") // ESC d 5 — feed 5 lines

        // Cut paper
        cmd.append("\u001D\u0056\u0000") // GS V 0 — full cut

        return cmd.toString().toByteArray(charset("windows-1252"))
    }

    private fun sendToPrinter(bytes: ByteArray) {
        val ip = prefs.getString("printer_ip", "192.168.1.108") ?: "192.168.1.108"
        val port = prefs.getInt("printer_port", 9100)

        var socket: Socket? = null
        var output: OutputStream? = null
        try {
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), 5000)
            socket.soTimeout = 5000
            output = socket.getOutputStream()

            // Send in small chunks to avoid overflowing printer buffer
            val chunkSize = 512
            var offset = 0
            while (offset < bytes.size) {
                val end = minOf(offset + chunkSize, bytes.size)
                output.write(bytes, offset, end - offset)
                output.flush()
                offset = end
                if (offset < bytes.size) {
                    Thread.sleep(100) // pause between chunks
                }
            }
            // Wait for printer to finish processing
            Thread.sleep(500)
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            output?.close()
            socket?.close()
        }
    }
}
