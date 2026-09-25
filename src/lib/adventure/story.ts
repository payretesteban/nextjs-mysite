/**
 * "The Deep Drop": skydive → malfunction → water landing → gear up → cave dive → treasure → ascent → rescue.
 * Based on real skydiving and scuba safety practice, simplified for a game. Not training material.
 */
import type { Ctx, Outcome, Stage } from "./types";
import { alt, bar, depth, kg, kmh, rate, statusAlt, statusDive, statusSurface } from "./units";

/** Build a matcher from alternatives (regex fragments) tested against the normalized command. */
const rx = (...alternatives: string[]) => new RegExp(`\\b(?:${alternatives.join("|")})\\b`);

/** Inventory text for the skydiving stages. */
const SKY_KIT = "A skydiving rig (main and reserve parachutes), an altimeter on your wrist, and a waterproof gear bag with your scuba kit.";
/** Inventory text once the scuba kit is on; mentions the treasure after it's sent up. */
const diveKit = (ctx: Ctx) =>
  `BCD with tank, mask, regulator and pressure gauge, fins, a primary light and two backups, a cave line reel, a lift bag and a GPS rescue beacon.${
    ctx.has("treasure_sent") && !ctx.has("no_treasure") ? " Somewhere above you, a lift bag with a treasure chest." : ""
  }`;

/** Lesson shown when the player dies by gearing up in the wrong order. */
const BUOYANCY_LESSON = "Get buoyant first: open the valve, put on the BCD and inflate it. Everything else comes after.";
/**
 * Death outcome for putting on a piece of gear before being buoyant.
 * @param item - The gear the player tried to put on, e.g. "mask".
 */
const tooEarly = (item: string): Outcome => ({
  die: true,
  text: `You try to wrestle the ${item} on while treading water. A wave breaks over you, you swallow a mouthful of sea, and your legs give out.`,
  lesson: BUOYANCY_LESSON,
});

/** Every stage, in play order. The engine looks them up by `id`. */
export const STAGES: Stage[] = [
  /* 1 ─────────────────────────────────────────────────────────────── */
  {
    id: "plane",
    title: "Aboard the jump plane",
    intro: () =>
      `The jump plane levels off at ${alt(4000)} above a turquoise sea. You're wearing a skydiving rig, and your scuba kit is packed in a waterproof gear bag clipped under your harness. Somewhere below, in an underwater cave, lies the treasure you came for. The green light comes on. The door is open.`,
    status: () => statusAlt(4000),
    hint: () => "Good skydivers touch each handle before they exit. Then… you know what to do at an open door.",
    suggestions: () => ["check handles", "jump"],
    inventory: () => SKY_KIT,
    actions: [
      {
        match: rx("check (?:handles?|rig|gear|equipment|parachute)", "touch (?:handles?)"),
        run: () => ({
          text: "You touch each handle in turn: the main pilot chute on your hip, the red cutaway pad on the right, the silver reserve handle on the left. Good habit.",
          points: 5,
          set: ["handles"],
        }),
      },
      { match: rx("jump", "exit", "leap", "dive out", "go out", "skydive"), run: () => ({ text: "You dive out into the roaring wind.", points: 5, goto: "freefall" }) },
      {
        match: rx("pull", "deploy", "open (?:parachute|chute|main|reserve)"),
        run: () => ({ text: "Not inside the plane! That's how parachutes end up wrapped around the tail." }),
      },
    ],
  },

  /* 2 ─────────────────────────────────────────────────────────────── */
  {
    id: "freefall",
    title: "Freefall",
    intro: () =>
      `The wind roars past at about ${kmh(200)}. Your altimeter unwinds: ${alt(3000)}… ${alt(2000)}… ${alt(1100)}. Deployment altitude.`,
    status: (ctx) => statusAlt(ctx.count("#wait") ? 1050 : 1100),
    hint: () => "You're at deployment altitude. Deploy your main parachute.",
    suggestions: () => ["wait", "deploy main", "pull reserve"],
    inventory: () => SKY_KIT,
    actions: [
      {
        match: rx("pull reserve", "reserve", "pull silver(?: handle)?"),
        run: () => ({ text: "Save the reserve for emergencies. Deploy your main first." }),
      },
      {
        match: rx("deploy(?: main| parachute| chute| pilot chute)?", "pull (?:main|pilot chute|ripcord|chute|parachute)", "throw (?:pilot chute|pilot)", "open (?:main|parachute|chute)"),
        run: () => ({
          text: "You throw the pilot chute. Snap! But the canopy overhead is a spinning, line-twisted streamer. Your main has malfunctioned.",
          points: 10,
          goto: "malfunction",
        }),
      },
      {
        match: rx("wait", "keep falling", "enjoy(?: view| ride)?", "do nothing", "relax"),
        run: (ctx) =>
          ctx.count("#wait")
            ? {
                die: true,
                text: `You keep watching the sea rush up. By ${alt(600)} there isn't enough time left for any parachute to open.`,
                lesson: "Deploy at your planned altitude. In freefall, altitude awareness is everything.",
              }
            : { text: `You savour the view for a second. ${alt(1050)}. Your altimeter is practically shouting at you.`, set: ["#wait"] },
      },
    ],
  },

  /* 3 ─────────────────────────────────────────────────────────────── */
  {
    id: "malfunction",
    title: "Malfunction!",
    intro: () =>
      `Your main canopy is a twisted, spinning streamer, and it's spinning you faster and faster. Altimeter: ${alt(1000)}. Your decision altitude is ${alt(760)}: if it isn't fixed by then, you act. You don't have long.`,
    status: (ctx) => statusAlt(ctx.has("cutaway") ? 700 : ctx.count("#fight") ? 850 : 1000),
    hint: (ctx) =>
      ctx.has("cutaway")
        ? "The main is gone. Pull the silver reserve handle, now!"
        : "Get rid of the bad canopy before bringing out the good one: red handle first, then silver.",
    suggestions: () => ["try to fix it", "pull reserve", "cut away"],
    inventory: () => SKY_KIT,
    actions: [
      {
        match: rx("pull reserve", "reserve", "pull silver(?: handle)?", "pull left handle"),
        run: (ctx) =>
          ctx.has("cutaway")
            ? { text: "The reserve snaps open overhead: square, clean, beautiful. You let out the breath you were holding.", points: 10, goto: "canopy" }
            : {
                die: true,
                text: "You pull the reserve with the ruined main still attached. The reserve launches straight into the spinning mess, and the two canopies wrap around each other.",
                lesson: "With a malfunctioning main: cut away first (red handle), then pull the reserve (silver handle). In that order.",
              },
      },
      {
        match: rx("cut ?away(?: main)?", "cut (?:main|it) away", "pull red(?: handle| pad)?", "pull cutaway(?: handle| pad)?", "release main", "pull right handle", "jettison(?: main)?"),
        run: (ctx) =>
          ctx.has("cutaway")
            ? { text: "The main is already gone. Pull the reserve!" }
            : {
                text: `You peel the red cutaway pad and punch it. The ruined main whips away and you're in freefall again at ${alt(700)}. Pull the reserve. Now!`,
                points: 10,
                set: ["cutaway"],
              },
      },
      {
        match: rx("fix(?: it)?", "kick(?: out)?(?: twists)?", "clear (?:twists|lines)", "pull risers", "fight(?: it)?", "wait", "shake(?: it)?", "untwist"),
        run: (ctx) => {
          if (ctx.has("cutaway"))
            return {
              die: true,
              text: "Falling with nothing over your head, you hesitate. The sea arrives before any canopy can.",
              lesson: "After a cutaway, pull the reserve immediately.",
            };
          if (ctx.count("#fight"))
            return {
              die: true,
              text: `You're still fighting it as you blow through ${alt(760)}. Now it's too low to cut away safely.`,
              lesson: `Decide and act by your decision altitude (${alt(760)}). If the main isn't fixed by then, cut it away and pull the reserve.`,
            };
          return {
            text: `You kick and pull on the risers, but the twists won't clear and the spinning gets worse. ${alt(850)} and dropping.`,
            set: ["#fight"],
          };
        },
      },
    ],
  },

  /* 4 ─────────────────────────────────────────────────────────────── */
  {
    id: "canopy",
    title: "Under the reserve",
    intro: () =>
      `The reserve carries you gently toward the sea, ${alt(600)} below. There's no land in sight, so this will be a water landing. Your gear bag dangles from your harness.`,
    status: (ctx) => statusAlt(ctx.count("#wait") ? 100 : 600),
    hint: (ctx) =>
      ctx.has("prepped")
        ? "Flare just before you touch the water."
        : "Prepare early for a water landing: unclip the chest strap and loosen the leg straps, but stay in the harness.",
    suggestions: () => ["release harness", "loosen chest strap", "lower gear bag", "flare"],
    inventory: () => SKY_KIT,
    actions: [
      {
        match: rx(
          "(?:loosen|unclip|unbuckle|unfasten|open|undo|release) chest(?: strap)?",
          "prepare(?: for)?(?: water)?(?: landing)?",
          "loosen (?:leg )?straps?",
          "water landing procedure"
        ),
        run: () => ({
          text: "You unclip the chest strap and loosen the leg straps a little, but stay in the harness. Once you're in the water you'll be able to slip out fast.",
          points: 10,
          set: ["prepped"],
        }),
      },
      {
        match: rx("(?:lower|release|drop|deploy) (?:gear )?bag"),
        run: () => ({
          text: `You release the gear bag on its lowering line. It dangles ${depth(5)} below you and will hit the water first.`,
          points: 5,
          set: ["bag_lowered"],
        }),
      },
      {
        match: rx("release harness", "(?:unbuckle|unclip|remove|take off) harness", "get out(?: of)?(?: harness)?", "unbuckle", "jump", "let go", "drop out", "(?:release|unclip) leg straps"),
        run: () => ({
          die: true,
          text: `You wriggle out of the harness, sure the water is just below. It isn't: over open water it's almost impossible to judge height, and you fall ${depth(40)}.`,
          lesson: "Stay in the harness until your feet are in the water. Prepare early instead: unclip the chest strap and loosen the leg straps.",
        }),
      },
      {
        match: rx("flare", "pull (?:toggles|brakes)", "brake", "land"),
        run: (ctx) =>
          ctx.has("prepped")
            ? { text: "You wait until you're just above the waves, flare, take a deep breath and splash in feet first.", points: 10, goto: "water" }
            : {
                die: true,
                text: "You flare nicely and splash in, but you're still buckled in tight. The canopy settles on top of you and the soaked harness drags you down before you can unclip.",
                lesson: "Prepare for a water landing early: unclip the chest strap and loosen the leg straps, but stay in the harness until you're in the water.",
              },
      },
      {
        match: rx("wait", "drift", "enjoy(?: view)?", "do nothing", "steer", "look down"),
        run: (ctx) =>
          ctx.count("#wait")
            ? { die: true, text: "The sea rushes up and you forget to flare. You hit the water at full speed.", lesson: "Flare just above the water, like on any landing." }
            : { text: `${alt(100)}. The waves are getting big fast.`, set: ["#wait"] },
      },
    ],
  },

  /* 5 ─────────────────────────────────────────────────────────────── */
  {
    id: "water",
    title: "In the sea",
    intro: () =>
      "Splash! You come up spluttering. The wet reserve canopy is settling over your head, and the harness is dragging on you. Your gear bag bobs on its line nearby.",
    status: () => statusSurface(),
    hint: (ctx) =>
      !ctx.has("free") ? "The harness is dragging you down. Get out of it first." : !ctx.has("clear") ? "Follow a seam of the canopy to its edge." : "Open your gear bag.",
    suggestions: () => ["swim hard", "get out of harness", "follow a seam to the edge", "open gear bag"],
    inventory: () => SKY_KIT,
    actions: [
      {
        match: rx("follow (?:seam|seams)", "(?:find|swim to|go to|get to|reach) edge", "(?:lift|push|move) canopy", "get out from under(?: canopy)?", "get canopy off"),
        run: (ctx) =>
          ctx.has("free")
            ? { text: "You grab a seam and follow it hand over hand to the edge of the canopy. Open sky. You breathe.", points: 10, set: ["clear"] }
            : {
                die: true,
                text: "You try to work your way to the edge of the canopy, but the waterlogged harness drags you under.",
                lesson: "First slip out of the harness, then follow a seam of the canopy to its edge.",
              },
      },
      {
        match: rx("(?:get|slip|climb|wriggle) out(?: of)?(?: harness| rig)?", "release harness", "(?:take off|remove|ditch|drop) (?:harness|rig)", "unbuckle(?: harness)?"),
        run: () => ({ text: "You slip out of the loosened harness and push the heavy rig away. Much better.", points: 10, set: ["free"] }),
      },
      {
        match: rx("(?:open|grab|get|pull in|reel in|unzip|check) (?:gear )?bag", "pull bag"),
        run: (ctx) =>
          ctx.has("clear")
            ? { text: "You pull the gear bag in on its line and unzip it.", points: 5, goto: "gearup" }
            : { text: "You can't get at the bag with the canopy on top of you." },
      },
      {
        match: rx("swim(?: hard| fast| away| up)?", "thrash", "panic", "kick"),
        run: (ctx) =>
          ctx.has("clear")
            ? { text: "Save your energy. You'll need it. Get your gear out of the bag." }
            : {
                die: true,
                text: "You thrash under the canopy and the suspension lines wrap around your arms and legs.",
                lesson: "Under a canopy in the water, stay calm: get out of the harness, then follow a seam to the edge.",
              },
      },
    ],
  },

  /* 6 ─────────────────────────────────────────────────────────────── */
  {
    id: "gearup",
    title: "Gearing up in the swell",
    intro: () =>
      "Inside the bag: a BCD with the tank already mounted and weights built in, a mask, a regulator with a pressure gauge, fins, a primary dive light and two backups, a cave line reel, a lift bag and a GPS rescue beacon. You're treading water in a light swell and getting tired. What matters most comes first.",
    status: (ctx) => (ctx.has("gauge") ? statusSurface(200) : statusSurface()),
    hint: (ctx) => {
      if (!ctx.has("valve") || !ctx.has("bcd") || !ctx.has("floating")) return "Buoyancy first: open the valve, put on the BCD, inflate it.";
      const missing = [["mask", "mask"], ["reg", "regulator"], ["gauge", "gauge check"], ["fins", "fins"]].filter(([f]) => !ctx.has(f)).map(([, n]) => n);
      return missing.length ? `Still missing: ${missing.join(", ")}. Then descend.` : "All set. Descend.";
    },
    suggestions: () => ["put on fins", "open valve", "put on BCD", "inflate BCD", "put on mask", "regulator in mouth", "check gauge", "descend"],
    inventory: diveKit,
    actions: [
      {
        match: rx("open (?:tank |air )?valve", "turn on (?:air|tank|valve)", "open (?:tank|air)"),
        run: () => ({ text: "You open the tank valve. A short hiss: the air is on.", points: 10, set: ["valve"] }),
      },
      {
        match: rx("(?:put on|wear|don|strap on|get into|get in|slip into) (?:bcd|vest|jacket|bc|tank|scuba)", "bcd on"),
        run: () => ({ text: "You slip into the BCD while it floats in front of you, and the tank settles on your back. Straps clicked.", points: 10, set: ["bcd"] }),
      },
      {
        match: rx("inflate(?: bcd| vest| jacket| bc)?", "add air(?: to (?:bcd|vest|bc))?", "fill (?:bcd|vest|bc)", "blow (?:into|up) (?:bcd|vest|bc)", "press inflator"),
        run: (ctx) => {
          if (!ctx.has("bcd")) return { text: "Put the BCD on first." };
          if (!ctx.has("valve")) return { text: "You press the inflator button. Nothing happens: the tank valve is still closed." };
          return {
            text: "You press the inflator. The BCD fills and you bob comfortably at the surface, head well clear of the waves. Now you can gear up calmly.",
            points: 10,
            set: ["floating"],
          };
        },
      },
      {
        match: rx("(?:put on|wear|don|fit) mask", "mask on"),
        run: (ctx) =>
          ctx.has("floating") ? { text: "You rinse the mask and seal it on your face.", points: 5, set: ["mask"] } : tooEarly("mask"),
      },
      {
        match: rx("(?:put|place|take) (?:in )?(?:regulator|reg)", "(?:regulator|reg) in(?: mouth)?", "(?:breathe|test|try) (?:from )?(?:regulator|reg)"),
        run: (ctx) =>
          ctx.has("floating")
            ? { text: "You put the regulator in your mouth, purge it and take a few slow breaths. Dry, easy air.", points: 5, set: ["reg"] }
            : tooEarly("regulator"),
      },
      {
        match: rx("check (?:gauge|air|pressure|spg|tank)", "read (?:gauge|pressure)", "look at gauge"),
        run: (ctx) => {
          if (!ctx.has("floating")) return tooEarly("gauge");
          if (!ctx.has("reg")) return { text: "Put the regulator in your mouth first, so you can watch the needle while you breathe." };
          return {
            text: `You breathe from the regulator and watch the gauge: the needle stays steady at ${bar(200)}. The valve is fully open and the tank is full.`,
            points: 5,
            set: ["gauge"],
          };
        },
      },
      {
        match: rx("(?:put on|wear|don) fins", "fins on"),
        run: (ctx) =>
          ctx.has("floating") ? { text: "You cross one leg over the other and pull on each fin. Ready to swim.", points: 5, set: ["fins"] } : tooEarly("fins"),
      },
      {
        match: rx("descend", "dive", "go down", "deflate(?: bcd| vest| bc)?", "dump air", "sink", "submerge", "go under"),
        run: (ctx) => {
          if (!ctx.has("floating")) return { die: true, text: "You slip under before you're even geared up.", lesson: BUOYANCY_LESSON };
          if (!ctx.has("mask"))
            return { die: true, text: "You sink without a mask. The reef is a blur, you can't read your gauge, and you lose track of which way is up.", lesson: "Mask, regulator, gauge check and fins before you descend." };
          if (!ctx.has("reg"))
            return { die: true, text: "You slip under without the regulator in your mouth and gulp a lungful of sea water.", lesson: "Regulator in and breathing before you descend." };
          if (!ctx.has("gauge"))
            return {
              die: true,
              text: `You never watched the gauge while breathing. At ${depth(18)} every breath gets harder: the valve was only partly open, and the tank is emptying faster than you think.`,
              lesson: "Check your gauge while breathing from the regulator before every descent. A needle that dips means a problem.",
            };
          if (!ctx.has("fins"))
            return { die: true, text: "Without fins you can't swim against the current. It sweeps you off the reef and out into the blue.", lesson: "Fins on before you descend." };
          return { text: `You dump the air from your BCD, equalize your ears every metre, and sink along the reef wall to ${depth(18)}.`, points: 10, goto: "entrance" };
        },
      },
    ],
  },

  /* 7 ─────────────────────────────────────────────────────────────── */
  {
    id: "entrance",
    title: "The cave mouth",
    intro: () =>
      `You settle at ${depth(18)} beside a dark opening in the rock: the cave. Daylight only reaches a few metres inside. Cave divers live by three rules: a continuous guideline to open water, strict gas management, and plenty of light.`,
    status: () => statusDive(18, 190),
    hint: (ctx) => {
      const missing = [["light", "lights on"], ["line", "a guideline tied off outside"], ["thirds", "a gas plan (check your gauge)"]]
        .filter(([f]) => !ctx.has(f))
        .map(([, n]) => n);
      return missing.length ? `Before you enter: ${missing.join(", ")}.` : "Everything's ready. Enter the cave.";
    },
    suggestions: () => ["enter cave", "turn on lights", "tie off the line", "check gauge"],
    inventory: diveKit,
    actions: [
      {
        match: rx("(?:turn|switch) on (?:light|lights|torch|torches|primary)", "lights? on", "check (?:lights|torches|backup lights)"),
        run: () => ({ text: "You switch on your primary light and check both backups. Three lights: the cave diver's minimum.", points: 10, set: ["light"] }),
      },
      {
        match: rx("tie(?: off| on| in)?(?: line| reel| guideline)?", "(?:attach|run|use|deploy|lay|secure) (?:line|reel|guideline)", "primary tie ?off"),
        run: () => ({
          text: "You tie your guideline to a solid rock outside the entrance, in open water, and add a second tie-off just inside. A continuous line back to daylight.",
          points: 10,
          set: ["line"],
        }),
      },
      {
        match: rx("check (?:gauge|air|pressure|gas)", "plan (?:gas|dive)", "(?:rule of )?thirds", "calculate (?:turn|thirds|gas)", "turn pressure", "gas plan"),
        run: () => ({
          text: `${bar(190)}. Rule of thirds: a third to go in, a third to get out, a third kept for emergencies. You'll turn back at ${bar(127)}, no matter what.`,
          points: 10,
          set: ["thirds"],
        }),
      },
      {
        match: rx("enter(?: cave)?", "go in(?:side)?", "swim in(?:to)?(?: cave)?", "go into cave", "explore(?: cave)?", "penetrate"),
        run: (ctx) => {
          if (!ctx.has("light"))
            return {
              die: true,
              text: "You swim into the dark without switching on your lights. Ten metres in, you can't see your own hands.",
              lesson: "Cave divers carry three lights and turn the primary on before entering.",
            };
          if (!ctx.has("line"))
            return {
              die: true,
              text: "Twenty metres in, a fin brushes the floor and silt swallows everything. With no line to follow, you can't find the way out.",
              lesson: "Always run a continuous guideline from open water. It's your only reliable way out when visibility disappears.",
            };
          if (!ctx.has("thirds"))
            return {
              die: true,
              text: "You swim deeper and deeper without watching your gas. Halfway back, the regulator starts to breathe hard.",
              lesson: "Use the rule of thirds: turn back once you've used a third of your gas.",
            };
          return { text: "Lights on, line tied off, gas plan set. You swim into the cave, the reel clicking as you lay line behind you.", points: 10, goto: "cave" };
        },
      },
    ],
  },

  /* 8 ─────────────────────────────────────────────────────────────── */
  {
    id: "cave",
    title: "Inside the cave",
    intro: () => "Your light sweeps a low tunnel. The floor is fine silt that will billow into a blinding cloud at the slightest touch.",
    status: () => statusDive(22, 160),
    hint: () => "Silt floor: use a gentle frog kick and keep your fins high.",
    suggestions: () => ["kick hard", "frog kick"],
    inventory: diveKit,
    actions: [
      {
        match: rx("frog ?kick", "kick gently", "gentle kick", "swim (?:gently|slowly|carefully)", "glide"),
        run: () => ({
          text: "Gentle frog kicks, fins high and flat, well off the floor. The silt stays put. Ahead, the tunnel opens into a chamber…",
          points: 10,
          goto: "chamber",
        }),
      },
      {
        match: rx("flutter ?kick", "kick(?: hard| fast)?", "swim (?:fast|hard|quickly)", "touch (?:floor|bottom)", "stand(?: up)?", "crawl", "hurry", "rush"),
        run: () => ({
          die: true,
          text: "Your kicks churn up the silt and visibility drops to zero. In the confusion you let go of the line, and you can't find it again.",
          lesson: "In silty caves, use a gentle frog kick with your fins held high. Silt-outs are one of the biggest dangers in cave diving.",
        }),
      },
      {
        match: rx("follow (?:line|guideline)", "swim(?: forward| on| ahead)?", "continue", "go forward", "move on"),
        run: () => ({ text: "How will you swim through here? Think about that silt floor." }),
      },
    ],
  },

  /* 9 ─────────────────────────────────────────────────────────────── */
  {
    id: "chamber",
    title: "The treasure chamber",
    intro: () =>
      `The chamber glitters in your light. Half-buried in the sand sits a small iron-bound chest, heavier than it looks: about ${kg(20)}. Your gauge reads ${bar(128)}, just above your turn pressure of ${bar(127)}.`,
    status: () => statusDive(24, 128),
    hint: (ctx) =>
      !ctx.has("bag_on")
        ? "You're at your turn pressure, so no exploring. Don't carry it either: the lift bag is made for this."
        : !ctx.has("neutral")
          ? "Add just a little air: neutral, not floating up. There's a ceiling above you."
          : "Follow the line out.",
    suggestions: () => ["explore further", "carry the chest", "attach lift bag", "inflate lift bag a little", "follow the line out"],
    inventory: diveKit,
    actions: [
      {
        match: rx("(?:inflate|use|fill) (?:bcd|vest|bc)", "put chest (?:in|on) (?:bcd|vest)", "clip chest to (?:me|bcd|myself)"),
        run: () => ({
          die: true,
          text: "You clip the chest to yourself and pump air into your BCD to carry it. Suddenly heavy and unstable, you fin hard, silt out the cave and breathe fast. Your gas drains away.",
          lesson: "Never use your BCD to lift a load. Use a lift bag attached to the object.",
        }),
      },
      {
        match: rx("(?:fully|completely) inflate(?: lift)?(?: bag)?", "inflate (?:lift )?bag (?:fully|completely|all the way)", "fill (?:lift )?bag(?: fully| completely| all the way| up)?"),
        run: (ctx) =>
          ctx.has("bag_on")
            ? {
                die: true,
                text: "The bag balloons and the chest shoots up, slams into the cave ceiling and brings down a shower of rock and silt.",
                lesson: "Inside a cave, add only enough air to make the load neutral. There's a ceiling above you.",
              }
            : { text: "Attach the lift bag to the chest first." },
      },
      {
        match: rx("inflate (?:lift )?bag(?: little| slightly| bit| partially)?", "add (?:little |some )?air to (?:lift )?bag", "inflate (?:little|bit|slightly)", "make (?:it|chest) neutral", "partially inflate(?: lift)?(?: bag)?"),
        run: (ctx) =>
          ctx.has("bag_on")
            ? {
                text: "A few puffs from your backup regulator, just until the chest floats neutrally a hand's width above the sand. Not positive: there's rock overhead.",
                points: 10,
                set: ["neutral"],
              }
            : { text: "Attach the lift bag to the chest first." },
      },
      {
        match: rx("(?:attach|clip|tie|hook|connect|fasten) (?:lift )?bag(?: to chest)?", "(?:attach|clip|tie) chest", "use lift bag", "lift bag"),
        run: () => ({ text: "You clip the lift bag to the chest's iron handle.", points: 10, set: ["bag_on"] }),
      },
      {
        match: rx("(?:pick up|carry|lift|take|grab|drag|hold) (?:chest|treasure)", "pick (?:it|chest) up"),
        run: () => ({
          die: true,
          text: `You heave the chest into your arms. Suddenly ${kg(20)} heavier, you fin hard, churn up the silt and breathe fast. Your gas drains away long before the exit.`,
          lesson: "Don't carry heavy objects underwater. Attach a lift bag and make the load neutral.",
        }),
      },
      {
        match: rx("explore(?: further| more)?", "go deeper", "keep going", "continue", "swim (?:deeper|further|on)", "search"),
        run: () => ({
          die: true,
          text: "Just a few more metres… By the time you turn around you're well past your turn pressure, and your gas runs out halfway back to the entrance.",
          lesson: "When you reach your turn pressure, you turn. No exceptions.",
        }),
      },
      {
        match: rx("leave (?:chest|treasure|it)", "abandon(?: chest| treasure)?", "forget (?:chest|treasure|it)"),
        run: () => leaveTreasure,
      },
      {
        match: rx("(?:follow|take) (?:line|guideline)(?: out| back)?", "exit(?: cave)?", "swim out", "go back", "turn (?:around|back)", "leave(?: cave)?", "head out", "return"),
        run: (ctx) => {
          if (ctx.has("neutral"))
            return {
              text: "You follow the line back out, guiding the floating chest ahead of you and reeling in the line as you go. Daylight!",
              points: 10,
              goto: "exit",
            };
          if (ctx.has("bag_on")) return { text: "The chest is too heavy to drag along. Add a little air to the lift bag first, or leave it behind." };
          return leaveTreasure;
        },
      },
    ],
  },

  /* 10 ────────────────────────────────────────────────────────────── */
  {
    id: "exit",
    title: "Back at the cave mouth",
    intro: () =>
      `You're back at the cave mouth at ${depth(18)}, in open water, with ${bar(95)} left. The chest hovers beside you on its lift bag. It needs to go to the surface, and so do you.`,
    status: () => statusDive(18, 95),
    hint: () => "Send the chest up on its own. Never attach yourself to a lift bag.",
    suggestions: () => ["hold on to the lift bag", "send up the lift bag"],
    inventory: diveKit,
    actions: [
      {
        match: rx("(?:hold|grab|hang)(?: on to| onto| on)? (?:lift )?bag", "clip (?:lift )?bag to (?:me|myself|bcd)", "ride (?:lift )?bag", "hold chest", "(?:ascend|go up) with (?:chest|bag|lift bag)"),
        run: () => ({
          die: true,
          text: "You hang on as the bag rises. The air inside expands as it goes up, the bag accelerates, and you're dragged to the surface far too fast.",
          lesson: "Never attach yourself to a lift bag. Send it up on its own and ascend at your own safe pace.",
        }),
      },
      {
        match: rx("send(?: up)?(?: lift)?(?: bag)?(?: up)?", "send (?:it|chest) up", "(?:fully )?inflate (?:lift )?bag", "fill (?:lift )?bag", "let (?:go|it go)(?: of)?(?: bag)?", "release (?:lift )?bag"),
        run: () => ({
          text: "You add air to the lift bag, check that nothing is clipped to you, and let go. The bag and chest rise away toward the light. They'll be waiting at the surface.",
          points: 10,
          set: ["treasure_sent"],
          goto: "ascent",
        }),
      },
      { match: rx("ascend", "go up", "surface", "swim up"), run: () => ({ text: "The chest first: send up the lift bag, then worry about yourself." }) },
    ],
  },

  /* 11 ────────────────────────────────────────────────────────────── */
  {
    id: "ascent",
    title: "The ascent",
    intro: (ctx) =>
      `Time to go up: ${depth(18)} of water above you${ctx.has("treasure_sent") ? ", your lift bag already on its way," : ""} and ${bar(90)} in your tank.`,
    status: (ctx) => (ctx.has("up") ? statusDive(5, 80) : statusDive(18, 90)),
    hint: (ctx) =>
      !ctx.has("up")
        ? `Ascend slowly: no faster than ${rate(9)}, breathing normally.`
        : !ctx.has("stopped")
          ? `Make a safety stop: 3 minutes at ${depth(5)}.`
          : "Now surface.",
    suggestions: () => ["inflate BCD", "hold breath", "ascend slowly", "safety stop", "surface"],
    inventory: diveKit,
    actions: [
      {
        match: rx("inflate(?: bcd| vest| bc)?", "swim up (?:fast|quickly)", "(?:race|rocket|shoot|rush|hurry) up", "(?:ascend|go up) (?:fast|quickly)", "emergency ascent", "kick up"),
        run: () => ({
          die: true,
          text: `You race for the light. Coming up far faster than ${rate(9)}, the nitrogen dissolved in your body fizzes out like a shaken soda.`,
          lesson: `Ascend no faster than ${rate(9)}, venting your BCD as the air in it expands.`,
        }),
      },
      {
        match: rx("hold(?: my)? breath", "stop breathing"),
        run: () => ({
          die: true,
          text: "You hold your breath on the way up. As the water pressure drops, the air in your lungs expands and tears lung tissue.",
          lesson: "Never hold your breath while ascending. Breathe normally all the way up.",
        }),
      },
      {
        match: rx("surface", "go to surface", "(?:ascend|go up|swim up) to surface", "finish ascent", "break surface"),
        run: (ctx) => {
          if (!ctx.has("up"))
            return {
              die: true,
              text: `You swim straight for the surface, far faster than ${rate(9)}. The nitrogen in your body comes out of solution all at once.`,
              lesson: `Ascend slowly (no faster than ${rate(9)}) and make a safety stop at ${depth(5)}.`,
            };
          if (!ctx.has("stopped"))
            return {
              die: true,
              text: "You skip the safety stop and pop up. An hour later your joints ache and your skin itches: decompression sickness, a long way from any chamber.",
              lesson: `Make a safety stop on every dive: 3 minutes at ${depth(5)}.`,
            };
          return { text: `You rise the last ${depth(5)} slowly and break the surface.`, points: 10, goto: "surface" };
        },
      },
      {
        match: rx("ascend(?: slowly| carefully)?", "go up(?: slowly)?", "swim up(?: slowly)?", "slow ascent", "rise(?: slowly)?", "start ascent"),
        run: (ctx) =>
          ctx.has("up")
            ? { text: `You're already at ${depth(5)}. Safety stop, then surface.` }
            : {
                text: `You rise slowly, no faster than your smallest bubbles (about ${rate(9)}), venting your BCD as the air expands and breathing normally. You level off at ${depth(5)}.`,
                points: 10,
                set: ["up"],
              },
      },
      {
        match: rx("safety stop", "(?:do|make|perform) (?:safety )?stop", "wait(?: 3| three)?(?: minutes| min)?", "hover", "stop"),
        run: (ctx) =>
          ctx.has("up")
            ? { text: `You hover at ${depth(5)} for three minutes, watching your bubbles and letting the extra nitrogen leave your body.`, points: 10, set: ["stopped"] }
            : { text: `Your safety stop is at ${depth(5)}. Ascend slowly first.` },
      },
    ],
  },

  /* 12 ────────────────────────────────────────────────────────────── */
  {
    id: "surface",
    title: "Back at the surface",
    intro: (ctx) =>
      `You break the surface. The sea is empty to the horizon, and the plane is long gone.${
        ctx.has("treasure_sent") ? ` Your lift bag bobs ${depth(20)} away, the chest hanging beneath it.` : ""
      }`,
    status: () => statusSurface(70),
    hint: (ctx) => (!ctx.has("floating_top") ? "Buoyancy first: inflate your BCD." : "Activate your GPS rescue beacon."),
    suggestions: (ctx) => ["activate GPS", "inflate BCD", "swim for shore", ...(ctx.has("treasure_sent") ? ["grab the lift bag"] : [])],
    inventory: diveKit,
    actions: [
      {
        match: rx("(?:activate|turn on|switch on|press|use|trigger|start|deploy) (?:gps|beacon|plb|rescue beacon|locator|epirb|radio)", "gps", "call (?:for )?(?:help|rescue)"),
        run: (ctx) =>
          ctx.has("floating_top")
            ? { text: winText(ctx), points: 20, win: true }
            : {
                die: true,
                text: "You fumble with the beacon while bobbing low in the swell. A wave slaps your face, the beacon slips out of your hand and sinks into the blue. Nobody knows where you are.",
                lesson: "At the surface, inflate your BCD first. Get buoyant, then deal with everything else.",
              },
      },
      {
        match: rx("inflate(?: bcd| vest| bc)?", "add air(?: to (?:bcd|vest|bc))?", "fill (?:bcd|vest|bc)", "blow up (?:bcd|vest)"),
        run: () => ({ text: "You fill the BCD and float high and steady, head well clear of the waves.", points: 10, set: ["floating_top"] }),
      },
      {
        match: rx("(?:grab|get|swim to|fetch|secure|collect|retrieve) (?:lift )?(?:bag|chest|treasure)"),
        run: (ctx) => {
          if (!ctx.has("treasure_sent")) return { text: "Your lift bag is still in the cave. So is the chest." };
          if (!ctx.has("floating_top")) return { text: "Inflate your BCD before you swim anywhere." };
          return { text: "You swim over, clip the lift bag's line to your BCD and tow the chest back.", points: 10, set: ["secured"] };
        },
      },
      {
        match: rx("swim(?: to| for| toward| towards)? (?:shore|land|beach|island)", "swim away", "look for land"),
        run: () => ({
          die: true,
          text: "You swim toward where you think land might be. Two hours later you're exhausted, and even further from anyone looking for you.",
          lesson: "Stay put, stay buoyant and signal. Rescuers find a floating diver, not a swimming one.",
        }),
      },
    ],
  },
];

/** Outcome for leaving the treasure behind: a safe way out, but it caps the rank at "Survivor". */
const leaveTreasure: Outcome = {
  text: "You leave the chest where it lies and follow the line out, reeling it in as you go. Daylight. The treasure will wait; you get to dive another day.",
  set: ["no_treasure"],
  goto: "ascent",
};

/** The ending text; changes depending on whether the treasure was sent up and secured. */
function winText(ctx: Ctx) {
  const base =
    "You pull up the antenna, flip the cover and press the button. The beacon sends your GPS position to every boat nearby. Forty minutes later, a dive boat pulls alongside";
  if (!ctx.has("treasure_sent")) return `${base} and hauls you aboard. No treasure this time, but you're alive, and that's the best haul there is.`;
  return `${base}${ctx.has("secured") ? "" : " and the crew fish out your lift bag"}. On deck you pry open the chest: old silver coins, and a small brass plate engraved with <EP/>.`;
}
