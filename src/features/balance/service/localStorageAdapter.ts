import type { DayApiData } from "#/features/balance/types/api";

const STORAGE_PREFIX = "finance";

function dayKey(year: number, month: number, day: number): string {
	return `${STORAGE_PREFIX}_day_${year}_${month}_${day}`;
}

function monthConfigKey(year: number, month: number): string {
	return `${STORAGE_PREFIX}_month_${year}_${month}`;
}

function onboardingKey(): string {
	return `${STORAGE_PREFIX}_onboarding_done`;
}

function globalDiarioKey(): string {
	return `${STORAGE_PREFIX}_global_diario_value`;
}

export function readDayData(
	year: number,
	month: number,
	day: number,
): Partial<DayApiData> | null {
	const raw = localStorage.getItem(dayKey(year, month, day));
	if (!raw) return null;

	return JSON.parse(raw) as Partial<DayApiData>;
}

export function writeDayData(
	year: number,
	month: number,
	day: number,
	data: Partial<DayApiData>,
): void {
	const existing = readDayData(year, month, day) ?? {};
	const merged = { ...existing, ...data };
	localStorage.setItem(dayKey(year, month, day), JSON.stringify(merged));
}

export interface MonthConfig {
	diario_value: number;
}

export function readMonthConfig(
	year: number,
	month: number,
): MonthConfig | null {
	const raw = localStorage.getItem(monthConfigKey(year, month));
	if (!raw) return null;

	return JSON.parse(raw) as MonthConfig;
}

export function writeMonthConfig(
	year: number,
	month: number,
	config: MonthConfig,
): void {
	localStorage.setItem(monthConfigKey(year, month), JSON.stringify(config));
}

export function readGlobalDiarioValue(): number | null {
	const raw = localStorage.getItem(globalDiarioKey());
	if (!raw) return null;

	const parsed = Number.parseFloat(raw);
	return Number.isNaN(parsed) ? null : parsed;
}

export function writeGlobalDiarioValue(value: number): void {
	localStorage.setItem(globalDiarioKey(), String(value));
}

export function isOnboardingDone(): boolean {
	return localStorage.getItem(onboardingKey()) === "true";
}

export function markOnboardingDone(): void {
	localStorage.setItem(onboardingKey(), "true");
}
