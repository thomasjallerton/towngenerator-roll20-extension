import './App.css';
import {setMode, useWatchMode, Mode, useSettlements, addSettlement, removeSettlement} from "@/src/settings.ts";
import logo from "@/assets/wide-logo-with-text.png";
import {useCallback} from "react";
import {MdDelete, MdOpenInNew} from "react-icons/md";
import {Tooltip} from 'react-tooltip'

type Tab = 'main' | 'import';

function App() {
    const mode = useWatchMode();

    return (
        <>
            <img src={logo} className="logo react" alt="React logo"/>
            <ModeSelector mode={mode}/>
            {mode === 'gm' && <GmMenu/>}
        </>
    );
}

function ModeSelector({mode}: { mode: Mode }) {
    return <div className="mode-selector">
        Mode:
        <button className={mode === 'player' ? 'selected' : ''} onClick={() => setMode('player')}>Player</button>
        <button className={mode === 'gm' ? 'selected' : ''} onClick={() => setMode('gm')}>GM</button>
    </div>
}


function GmMenu() {
    const [tab, setTab] = useState<Tab>('main')

    const textElement = useRef<HTMLTextAreaElement>(null)

    const importSettlement = useCallback(async () => {
        const textElem = textElement.current!
        let value: any;
        try {
            value = JSON.parse(textElem.value);
        } catch (e) {
            alert("Invalid import format")
        }
        const name = value.name
        const id = value.id

        if (name == null || typeof name !== 'string' || id == null || typeof id !== 'string') {
            alert("Invalid import format")
            return
        }

        await addSettlement({id, name});

        setTab("main");
    }, [setTab])

    return <div className="gm-menu">
        {tab === 'main' && (
            <>
                <div className="gm-actions">
                    <button onClick={() => postChat("ftg close")}>Close map</button>
                    <button onClick={() => postChat("ftg sync")}>Sync</button>
                    <button onClick={() => setTab('import')}>Import settlement</button>
                </div>
                <Settlements/>
            </>
        )}
        {tab === 'import' && (
            <div className="import">
                <textarea
                    ref={textElement}
                    placeholder="{&#10;  &quot;id&quot;: &quot;11111111-2222-3333-4444-55555555555&quot;,&#10;  &quot;name&quot;: &quot;Settlement Name&quot;&#10;}"
                />
                <div className="import-actions">
                    <button onClick={() => setTab('main')}>Cancel</button>
                    <button onClick={importSettlement}>Import</button>
                </div>
            </div>
        )}
    </div>
}

function Settlements() {
    const settlements = useSettlements();

    const [canOpen, setCanOpen] = useState(false);

    useEffect(() => {
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            const activeTab = tabs[0]!;
            if (activeTab.url?.includes("https://app.roll20.net")) {
                setCanOpen(true)
            }
        })
    });

    return <>
        {settlements.length === 0 && 'No settlements imported'}
        {settlements.map(settlement => (
            <div className="list-item" key={settlement.name}>
                {settlement.name}
                {canOpen && (
                    <>
                        <button className="icon-button" data-tooltip-id="open-settlement" data-tooltip-delay-show={200}
                                onClick={() => postChat("ftg open " + settlement.id)}>
                            <MdOpenInNew/>
                        </button>
                        <Tooltip id="open-settlement" place="left" style={{fontSize: "0.7rem"}}>
                            Open in Roll20
                        </Tooltip>
                    </>
                )}

                <button className="icon-button" data-tooltip-id="remove-settlement" data-tooltip-delay-show={200}
                        onClick={() => removeSettlement(settlement)}>
                    <MdDelete/>
                </button>
                <Tooltip id="remove-settlement" place="left" style={{fontSize: "0.7rem"}}>
                    Remove from imports
                </Tooltip>
            </div>
        ))}
    </>
}

export default App;

async function postChat(message: string) {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    await browser.scripting.executeScript({
        target: {tabId: tab?.id!},
        func: (msg: string) => {
            const chat = document.getElementById("textchat-input")!;
            const txt = chat.getElementsByTagName("textarea")[0];
            const btn = chat.getElementsByTagName("button")[0];
            const speakingAs = document.getElementById("speakingas")! as HTMLSelectElement;

            const old_as = speakingAs.value;
            (speakingAs.childNodes[0] as HTMLOptionElement).selected = true;
            const old_text = txt.value;
            txt.value = msg;
            btn.click();
            txt.value = old_text;
            speakingAs.value = old_as;
        },
        args: [message]
    });
}
