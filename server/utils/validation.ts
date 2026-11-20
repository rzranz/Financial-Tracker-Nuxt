import Decimal from 'decimal.js'
import { z } from 'zod'

const decimalStringSchema = (maxDigits: number, maxDecimals: number, minExclusive = 0) =>
  z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: `Format angka harus desimal valid maksimal ${maxDecimals} digit desimal`
    })
    .refine(
      (val) => {
        try {
          const dec = new Decimal(val)
          const maxInt = new Decimal(10).pow(maxDigits - maxDecimals).minus(new Decimal(10).pow(-maxDecimals))
          return dec.gt(minExclusive) && dec.lte(maxInt)
        } catch {
          return false
        }
      },
      {
        message: `Nominal harus lebih besar dari ${minExclusive} dan sesuai batas presisi NUMERIC(${maxDigits},${maxDecimals})`
      }
    )

const nonNegativeDecimalSchema = (maxDigits: number, maxDecimals: number) =>
  z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: `Format persentase maksimal ${maxDecimals} digit desimal`
    })
    .refine(
      (val) => {
        try {
          const dec = new Decimal(val)
          const maxVal = new Decimal(10).pow(maxDigits - maxDecimals).minus(new Decimal(10).pow(-maxDecimals))
          return dec.gte(0) && dec.lte(maxVal)
        } catch {
          return false
        }
      },
      {
        message: `Persentase harus bernilai 0 sampai batas NUMERIC(${maxDigits},${maxDecimals})`
      }
    )

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1, 'Kategori wajib diisi').max(64, 'Kategori maksimal 64 karakter'),
  amount: decimalStringSchema(15, 2, 0),
  note: z
    .string()
    .trim()
    .max(240, 'Catatan maksimal 240 karakter')
    .optional()
    .nullable(),
  transaction_date: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
})

export const createInvestmentSchema = z.object({
  title: z.string().trim().min(2, 'Nama instrumen minimal 2 karakter').max(100, 'Nama instrumen maksimal 100 karakter'),
  principal_amount: decimalStringSchema(15, 2, 0),
  expected_return_pct: nonNegativeDecimalSchema(6, 2),
  duration_days: z.coerce
    .number()
    .int('Durasi harus bilangan bulat')
    .min(1, 'Durasi minimal 1 hari')
    .max(36500, 'Durasi maksimal 36.500 hari'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai harus YYYY-MM-DD')
    .optional(),
  deduct_from_cash: z.boolean().default(true)
})

export const claimInvestmentSchema = z.object({
  investmentId: z.string().uuid('ID kontrak investasi tidak valid')
})
