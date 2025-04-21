import './content-style.css';
import {getMode} from "@/src/settings.ts";

interface OpenSettlement {
    id: string,
    close: () => void,
    sync: () => void
}

export default defineContentScript({
    matches: ['*://app.roll20.net/*'],
    async main() {
        const chat = document.getElementById("textchat-input")!;

        function postChatMessage(message: string) {
            const txt = chat.getElementsByTagName("textarea")?.[0];
            const btn = chat.getElementsByTagName("button")?.[0];
            const speakingAs = document.getElementById("speakingas") as HTMLSelectElement;

            if (txt == null || btn == null || speakingAs == null) return;

            const old_as = speakingAs.value;
            (speakingAs.childNodes[0] as HTMLOptionElement).selected = true;
            const old_text = txt.value;
            txt.value = "FTG: " + message;
            btn.click();
            txt.value = old_text;
            speakingAs.value = old_as;
        }

        let openSettlement: OpenSettlement | null = null

        const messagesContainer = document.getElementById("textchat")
            ?.getElementsByClassName("content")?.[0];

        if (messagesContainer == null) return

        const chatObserver = new MutationObserver(async () => {
            const messages = messagesContainer.getElementsByClassName("message general")
            const lastMessage = messages[messages.length - 1];
            if (lastMessage === undefined) {
                return;
            }
            const message = [...lastMessage.childNodes.values()].find(node => node.nodeType === 3)?.textContent ?? "";

            if (!message.startsWith("ftg ")) {
                return;
            }

            const commandParts = message.split(" ").slice(1)
            const command = commandParts[0]
            if (command === undefined) {
                return
            } else if (command === 'open') {
                const settlementId = commandParts[1];
                if (openSettlement?.id !== settlementId) {
                    openSettlement = await openFantasyTownGenerator(settlementId)
                }
            } else if (command === 'close') {
                openSettlement?.close();
                openSettlement = null;
            } else if (command === 'sync') {
                openSettlement?.sync();
            } else if (command === 'help') {
                postChatMessage("available commands:\n- open $settlementId\n- close\n- refresh\n- help");
            } else {
                postChatMessage("unknown command " + command + '. Type "ftg help" to see a list of available commands.');
            }
        });
        chatObserver.observe(messagesContainer, {childList: true});

    },
});

/** Returns a callback that removes the iframe and cleans up any other state. */
async function openFantasyTownGenerator(settlementId: string): Promise<OpenSettlement> {
    const rightSideBar = document.getElementById("rightsidebar")!;
    const masterToolBar = document.getElementById("vm-master-toolbar")!;

    const iframe = document.createElement("iframe");
    iframe.classList.add("roll-20-ftg-iframe");
    iframe.src = await getIframeSrc(settlementId)

    const rightResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        iframe.style.width = `calc(100vw - ${entry.contentRect.width}px)`;
    });
    rightResizeObserver.observe(rightSideBar)

    masterToolBar.style.display = "none";

    rightSideBar.insertAdjacentElement("afterend", iframe)

    return {
        id: settlementId,
        close: () => {
            const elements = document.getElementsByClassName("roll-20-ftg-iframe")
            for (const element of elements) {
                element.remove()
            }
            masterToolBar.style.display = "";
            rightResizeObserver.disconnect()
        },
        sync: () => {
            const elements = document.getElementsByClassName("roll-20-ftg-iframe")
            for (const element of elements) {
                const iframe = element as HTMLIFrameElement
                iframe.src = iframe.src
            }
        }
    }
}

async function getIframeSrc(settlementId: string): Promise<string> {
    const mode = await getMode();
    const settlementPath = mode === 'gm' ? 'user/settlements' : 'public-settlements'
    return `https://www.fantasytowngenerator.com/${settlementPath}/${settlementId}?context=roll20`;
}

