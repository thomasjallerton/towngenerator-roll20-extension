
export type Mode = 'gm' | 'player';

const MODE_KEY = 'local:iframeMode'

export async function getMode(): Promise<Mode> {
    return await storage.getItem<Mode>(MODE_KEY) ?? 'player';
}

export async function setMode(mode: Mode) {
    await storage.setItem(MODE_KEY, mode);
}

export function useWatchMode(): Mode {
    const [mode, setMode] = useState<Mode>('player');

    useEffect(() => {
        getMode().then(initialMode => {
            setMode(initialMode);
        });

        return storage.watch<Mode>(MODE_KEY, newMode => {
            setMode(newMode ?? 'player');
        });
    }, [])

    return mode
}

const SETTLEMENTS_KEY = 'local:settlements'

export interface Settlement {
    id: string,
    name: string
}

export async function getSettlements(): Promise<readonly Settlement[]> {
    return await storage.getItem<readonly Settlement[]>(SETTLEMENTS_KEY) ?? []
}

export async function addSettlement(settlement: Settlement) {
    const current = await getSettlements();
    const filterDuplicates = current.filter(s => s.id !== settlement.id);
    await storage.setItem(SETTLEMENTS_KEY, [...filterDuplicates, settlement]);
}

export async function removeSettlement(settlement: Settlement) {
    const current = await getSettlements();
    await storage.setItem(SETTLEMENTS_KEY, current.filter(s => s.id !== settlement.id));
}

export function useSettlements(): readonly Settlement[] {
    const [settlements, setSettlements] = useState<readonly Settlement[]>([]);

    useEffect(() => {
        getSettlements().then(initialSettlements => {
            setSettlements(initialSettlements);
        });

        return storage.watch<readonly Settlement[]>(SETTLEMENTS_KEY, newSettlements => {
            setSettlements(newSettlements ?? []);
        });
    }, [])

    return settlements
}

