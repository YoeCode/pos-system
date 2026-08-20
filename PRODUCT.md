# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cashier (Cajero):** Procesa ventas en punto de venta físico. Acceso limitado a POS y caja.
- **Supervisor:** Vende productos + gestiona inventario y productos. Puede abrir/cerrar caja y supervisar operaciones.
- **Manager:** Acceso a métricas, reportes, gestión de empleados y configuraciones operativas.
- **Admin/Owner:** Control total del sistema. Gestiona tenants, usuarios, configuraciones globales y todas las operaciones.

Situación principal: Trabajadores de tienda física (Casa Lis) procesando ventas, gestionando stock y revisando métricas de negocio en tiempo real.

## Product Purpose

Sistema Point-of-Sale (POS) para Casa Lis que permite:
1. Procesar ventas rápidas en tienda física
2. Gestionar inventario y catálogo de productos
3. Administrar múltiples negocios (multi-tenancy)
4. Revisar métricas y reportes de ventas
5. Gestionar empleados y permisos por rol
6. Conectar con e-commerce futuro via API

Éxito = transacciones rápidas, inventario sincronizado, decisiones basadas en datos, escalabilidad multi-negocio.

## Positioning

Multi-tenant POS system diseñado para negocios físicos que necesitan:
- Unificar operaciones de venta e inventario
- Escalar a múltiples locales/negocios bajo una misma plataforma
- Integración futura con e-commerce y APIs externas
- Roles granulares que se adaptan a diferentes niveles de operarios

## Operating Context

- **Entorno:** Tienda física con cajas registradoras/tablets
- **Workflow principal:** Login → Selección de tenant → Dashboard/Operación según rol → POS venta → Cierre caja
- **Dispositivos:** Desktop para administración, tablets/touchscreens para POS
- **Conexión:** Requiere internet para sincronización (Supabase backend)
- **Horario:** Operativo durante horario comercial, cierres diarios
- **Documentos:** Tickets de venta impresos/enviados por email

## Capabilities and Constraints

- **Stack:** React 19, TypeScript, Vite, Redux Toolkit, Tailwind CSS, Supabase
- **Auth:** Session persistence via localStorage (`nexopos_session`)
- **Datos:** Mock/in-memory actualmente, migrando a Supabase
- **Features existentes:** POS, productos, inventario, empleados, clientes, reportes, settings, tenants, invitations
- **Tax rate:** 21% (shared constant)
- **Multi-tenancy:** Implementado con tenant selection y tenant settings
- **Roles:** 4 niveles (cashier → supervisor → manager → admin) + TenantRole (owner/admin/manager/supervisor/cashier)
- **Email:** EmailJS integration para envío de tickets
- **Export:** Excel/PDF para reportes
- **OCR:** Tesseract.js para reconocimiento de texto (posible uso en códigos de barras)
- **Constraint:** No backend API propio todavía; todo es mock o Supabase directo
- **Future:** API REST para e-commerce integration

## Brand Commitments

- Nombre: Casa Lis POS System
- Identidad: Profesional, limpio, orientado a operaciones de retail
- No hay guidelines visuales establecidos formalmente (oportunidad para Impeccable)

## Evidence on Hand

- Repositorio completo con implementación funcional
- Sistema de roles y permisos implementado
- Flujo de checkout completo (3-step modal)
- Componentes UI reutilizables existentes
- No hay DESIGN.md ni PRODUCT.md previos

## Product Principles

1. **Velocidad de operación:** El cajero debe completar una venta en segundos, no minutos
2. **Confiabilidad de datos:** Inventario y ventas deben ser precisos y trazables
3. **Escalabilidad multi-negocio:** Un sistema que crece con el negocio, no contra él
4. **Accesibilidad por roles:** Cada usuario ve exactamente lo que necesita, nada más
5. **Preparación para integración:** Arquitectura que permita conectar e-commerce sin reescribir

## Accessibility & Inclusion

- Soporte para touchscreens en POS
- Contraste adecuado para lectura en condiciones de luz variable en tienda
- Flujos simples que no requieren formación extensa
