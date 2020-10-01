
export const enum AssetType {
    ALST = 0x414C5354, // Anim List
    ANIM = 0x414E494D, // Anim
    ATBL = 0x4154424C, // Anim Table
    BOUL = 0x424F554C, // Boulder
    BUTN = 0x4255544E, // Button
    CAM  = 0x43414D20, // Camera
    CNTR = 0x434E5452, // Counter
    COLL = 0x434F4C4C, // Collision Table
    COND = 0x434F4E44, // Conditional
    CRDT = 0x43524454, // Credits
    CSN  = 0x43534E20, // Cutscene
    CSNM = 0x43534E4D, // Cutscene Mgr
    CTOC = 0x43544F43, // Cutscene TOC
    DPAT = 0x44504154, // Dispatcher
    DSCO = 0x4453434F, // Disco Floor
    DSTR = 0x44535452, // Destructible Object
    DYNA = 0x44594E41, // Dynamic
    EGEN = 0x4547454E, // Electric Arc Generator
    ENV  = 0x454E5620, // Environment
    FLY  = 0x464C5920, // Flythrough
    FOG  = 0x464F4720, // Fog
    GRUP = 0x47525550, // Group
    JAW  = 0x4A415720, // Jaw Data
    JSP  = 0x4A535020, // JSP
    LKIT = 0x4C4B4954, // Light Kit
    LODT = 0x4C4F4454, // LOD Table
    MAPR = 0x4D415052, // Surface Mapper
    MINF = 0x4D494E46, // Model Info
    MODL = 0x4D4F444C, // Model
    MRKR = 0x4D524B52, // Marker
    MVPT = 0x4D565054, // Move Point
    PARE = 0x50415245, // Particle Emitter
    PARP = 0x50415250, // Particle Emitter Props
    PARS = 0x50415253, // Particle System
    PICK = 0x5049434B, // Pickup Table
    PIPT = 0x50495054, // Pipe Info Table
    PKUP = 0x504B5550, // Pickup
    PLAT = 0x504C4154, // Platform
    PLYR = 0x504C5952, // Player
    PORT = 0x504F5254, // Portal
    RAW  = 0x52415720, // Raw
    RWTX = 0x52575458, // RenderWare Texture
    SFX  = 0x53465820, // SFX
    SHDW = 0x53484457, // Simple Shadow Table
    SHRP = 0x53485250, // Shrapnel
    SIMP = 0x53494D50, // Simple Object
    SND  = 0x534E4420, // Sound
    SNDI = 0x534E4449, // Sound Info
    SNDS = 0x534E4453, // Streaming Sound
    SURF = 0x53555246, // Surface
    TEXT = 0x54455854, // Text
    TIMR = 0x54494D52, // Timer
    TRIG = 0x54524947, // Trigger
    UI   = 0x55492020, // UI
    UIFT = 0x55494654, // UI Font
    VIL  = 0x56494C20, // Villain
    VILP = 0x56494C50  // Villain Props
}

export const enum BaseType
{
	Unknown,
	Trigger,
	Villain,
	Player,
	Pickup,
	Env,
	Platform,
	Camera,
	Door,
	SavePoint,
	Item,
	Static,
	Dynamic,
	MovePoint,
	Timer,
	Bubble,
	Portal,
	Group,
	Pendulum,
	SFX,
	FFX,
	VFX,
	Counter,
	Hangable,
	Button,
	Projectile,
	Surface,
	DestructObj,
	Gust,
	Volume,
	Dispatcher,
	Cond,
	UI,
	UIFont,
	ProjectileType,
	LobMaster,
	Fog,
	Light,
	ParticleEmitter,
	ParticleSystem,
	CutsceneMgr,
	EGenerator,
	Script,
	NPC,
	Hud,
	NPCProps,
	ParticleEmitterProps,
	Boulder,
	CruiseBubble,
	TeleportBox,
	BusStop,
	TextBox,
	TalkBox,
	TaskBox,
	BoulderGenerator,
	NPCSettings,
	DiscoFloor,
	Taxi,
	HUD_model,
	HUD_font_meter,
	HUD_unit_meter,
	BungeeHook,
	CameraFly,
	TrackPhysics,
	ZipLine,
	Arena,
	Duplicator,
	LaserBeam,
	Turret,
	CameraTweak,
	SlideProps,
	HUD_text,
	Count
};

export const enum EventID
{
	Unknown,
	Enable,
	Disable,
	Visible,
	Invisible,
	EnterPlayer,
	ExitPlayer,
	TouchPlayer,
	ControlOff,
	ControlOn,
	Reset,
	Increment,
	Decrement,
	Open,
	Close,
	Toggle,
	TeleportPlayer,
	OutOfBounds,
	Run,
	Stop,
	Expired,
	Move,
	Destroy,
	Pause,
	Play,
	PlayOne,
	PlayMaybe,
	RoomStart,
	Invalidate,
	Tilt,
	Untilt,
	Arrive,
	Mount,
	Dismount,
	Break,
	Pickup,
	Death,
	Kill,
	On,
	Off,
	NPCPatrolOn,
	NPCPatrolOff,
	NPCWanderOn,
	NPCWanderOff,
	NPCDetectOn,
	NPCDetectOff,
	NPCChaseOn,
	NPCChaseOff,
	NPCGoToSleep,
	NPCWakeUp,
	NPCRespawn,
	PlayerDeath,
	GiveChance,
	GiveShinyObjects,
	GiveHealth,
	Press,
	Unpress,
	ArriveHalfway,
	Hit,
	ButtonPressAction,
	Evaluate,
	True,
	False,
	PadPressX,
	PadPressSquare,
	PadPressO,
	PadPressTriangle,
	PadPressL1,
	PadPressL2,
	PadPressR1,
	PadPressR2,
	PadPressStart,
	PadPressSelect,
	PadPressUp,
	PadPressDown,
	PadPressRight,
	PadPressLeft,
	FontBackdropOn,
	FontBackdropOff,
	UISelect,
	UIUnselect,
	UIFocusOn,
	UIFocusOff,
	CollisionOn,
	CollisionOff,
	Collision_Visible_On,
	Collision_Visible_Off,
	SceneBegin,
	SceneEnd,
	RoomBegin,
	RoomEnd,
	LobMasterShoot,
	LobMasterReset,
	FallToDeath,
	UIFocusOn_Select,
	UIFocusOff_Unselect,
	Dispatcher_PadCfg_PresetA,
	Dispatcher_PadCfg_PresetB,
	Dispatcher_PadCfg_PresetC,
	Dispatcher_PadCfg_PresetD,
	Dispatcher_PadVibrateOn,
	Dispatcher_PadVibrateOff,
	Dispatcher_SoundMono,
	Dispatcher_SoundStereo,
	Dispatcher_SoundMasterIncrease,
	Dispatcher_SoundMasterDecrease,
	Dispatcher_SoundMusicIncrease,
	Dispatcher_SoundMusicDecrease,
	Dispatcher_SoundSFXIncrease,
	Dispatcher_SoundSFXDecrease,
	Dispatcher_IntroState_Sony,
	Dispatcher_IntroState_Publisher,
	Dispatcher_IntroState_Developer,
	Dispatcher_IntroState_License,
	Dispatcher_IntroState_Count,
	Dispatcher_TitleState_Start,
	Dispatcher_TitleState_Attract,
	Dispatcher_TitleState_Count,
	Dispatcher_LoadState_SelectMemCard,
	Dispatcher_LoadState_SelectSlot,
	Dispatcher_LoadState_Loading,
	Dispatcher_LoadState_Count,
	Dispatcher_OptionsState_Options,
	Dispatcher_OptionsState_Count,
	Dispatcher_SaveState_SelectMemCard,
	Dispatcher_SaveState_SelectSlot,
	Dispatcher_SaveState_Saving,
	Dispatcher_SaveState_Count,
	Dispatcher_PauseState_Pause,
	Dispatcher_PauseState_Options,
	Dispatcher_PauseState_Count,
	Dispatcher_GameState_FirstTime,
	Dispatcher_GameState_Play,
	Dispatcher_GameState_LoseChance,
	Dispatcher_GameState_GameOver,
	Dispatcher_GameState_SceneSwitch,
	Dispatcher_GameState_Dead,
	Dispatcher_SetIntroState_Sony,
	Dispatcher_SetIntroState_Publisher,
	Dispatcher_SetIntroState_Developer,
	Dispatcher_SetIntroState_License,
	Dispatcher_SetIntroState_Count,
	Dispatcher_SetTitleState_Start,
	Dispatcher_SetTitleState_Attract,
	Dispatcher_SetTitleState_Count,
	Dispatcher_SetLoadState_SelectMemCard,
	Dispatcher_SetLoadState_SelectSlot,
	Dispatcher_SetLoadState_Loading,
	Dispatcher_SetLoadState_Count,
	Dispatcher_SetOptionsState_Options,
	Dispatcher_SetOptionsState_Count,
	Dispatcher_SetSaveState_SelectMemCard,
	Dispatcher_SetSaveState_SelectSlot,
	Dispatcher_SetSaveState_Saving,
	Dispatcher_SetSaveState_Count,
	Dispatcher_SetPauseState_Pause,
	Dispatcher_SetPauseState_Options,
	Dispatcher_SetPauseState_Count,
	Dispatcher_SetGameState_FirstTime,
	Dispatcher_SetGameState_Play,
	Dispatcher_SetGameState_LoseChance,
	Dispatcher_SetGameState_GameOver,
	Dispatcher_SetGameState_SceneSwitch,
	Dispatcher_SetGameState_Dead,
	Digup,
	Dispatcher_GameState_Exit,
	Dispatcher_SetGameState_Exit,
	LobMasterShootFromWidget,
	Dispatcher_SLBack,
	Dispatcher_SLCancel,
	Dispatcher_SLRetry,
	Dispatcher_SLSelectCard,
	Dispatcher_SLSelectSlot,
	Dispatcher_SLOkay,
	VilHurtBoss,
	Attack,
	AttackOn,
	AttackOff,
	Drop,
	VilReport_StartingIdle,
	VilReport_StartingSleep,
	VilReport_StartingGuard,
	VilReport_StartingPatrol,
	VilReport_StartingDazed,
	VilReport_StartingLook,
	VilReport_StartingListen,
	VilReport_StartingInvestigate,
	VilReport_StartingChase,
	VilReport_StartingAttack,
	VilReport_StartingRetreat,
	Preload,
	Done,
	Arcto,
	DigupReaction,
	Dispatcher_StoreCheckPoint,
	AnimPlay,
	AnimPlayLoop,
	AnimStop,
	AnimPause,
	AnimResume,
	AnimTogglePause,
	AnimPlayRandom,
	AnimPlayMaybe,
	SetSpeed,
	Accelerate,
	MoveToTarget,
	SwingerFollow,
	ShaggyMount,
	ShaggyWitchDrop,
	ShaggySwap,
	ShaggyState,
	ShaggyAction,
	EnterEntity,
	ExitEntity,
	EnterEntityFLAG,
	ExitEntityFLAG,
	Drivenby,
	FollowTarget,
	FaceTarget,
	WatchTarget,
	ShaggyCollideOnly,
	Shaggy1_ThrowTarget,
	Shaggy8_CallEnable,
	Shaggy8_CallDisable,
	Shaggy8_SetMagnet,
	Shaggy8_ClearMagnet,
	StartMoving,
	StopMoving,
	Swoosh,
	ShaggySetDown,
	ShaggyGrabEnable,
	ShaggyGrabDisable,
	ShaggyGrabbed,
	ShaggyThrown,
	VilDoAction,
	GangDoBossAction,
	VilFakeChaseOn,
	VilFakeChaseOff,
	BossMMPushButton,
	VilReport_DecayComplete,
	VilGuardWidget,
	TextureAnimateOn,
	TextureAnimateOff,
	TextureAnimateToggle,
	ColorEffectOn,
	ColorEffectOff,
	ColorEffectToggle,
	SetTextureAnimGroup,
	SetTextureAnimSpeed,
	TextureAnimateStep,
	Emit,
	Emitted,
	TranslucentOn,
	TranslucentOff,
	TranslucentToggle,
	VilGangTalkOn,
	VilGangTalkOff,
	GivePowerUp,
	UnlockR001,
	UnlockS001,
	UnlockE001,
	UnlockF001,
	DisableGroupContents,
	ShaggyPhysHack,
	OccludeOn,
	OccludeOff,
	WaveSetLinear,
	WaveSetRipple,
	SituationLaugh,
	SituationBossBattleGreenGhost,
	SituationBossBattleRedBeard,
	SituationBossBattleMasterMind,
	SituationBossBattleBlacknight,
	SituationPlayerScare,
	SituationPlayerSafe,
	SituationPlayerDanger,
	SituationPlayerChaseBegin,
	SituationPlayerChaseEnd,
	SituationPlayerSeeShaggy,
	SituationPlayerSeeFood,
	SituationPlayerSeeToken,
	SituationPlayerSeeScoobySnack,
	SituationPlayerSeePowerup,
	SituationPlayerSeeMonster,
	SituationPlayerSuccess,
	SituationPlayerFailure,
	Dispatcher_ShowHud,
	Dispatcher_HideHud,
	Dispatcher_FadeOut,
	SetRain,
	SetSnow,
	ShaggyMowerStopMode,
	ScriptReset,
	WaitForInput,
	PlayMovie,
	DefeatedMM,
	Dispatcher_SetGameState_GameStats,
	PlayMusic,
	Forward,
	Reverse,
	PlayerRumbleTest,
	PlayerRumbleLight,
	PlayerRumbleMedium,
	PlayerRumbleHeavy,
	DispatcherScreenAdjustON,
	DispatcherScreenAdjustOFF,
	SetSkyDome,
	ConnectToChild,
	DuploWaveBegin,
	DuploWaveComplete,
	DuploNPCBorn,
	DuploNPCKilled,
	DuploExpiredMaxNPC,
	DuploPause,
	DuploResume,
	SetGoo,
	NPCScript_ScriptBegin,
	NPCScript_ScriptEnd,
	NPCScript_ScriptReady,
	NPCScript_Halt,
	NPCScript_SetPos,
	NPCScript_SetDir,
	NPCScript_LookNormal,
	NPCScript_LookAlert,
	NPCScript_FaceWidget,
	NPCScript_FaceWidgetDone,
	NPCScript_GotoWidget,
	NPCScript_GotoWidgetDone,
	NPCScript_AttackWidget,
	NPCScript_AttackWidgetDone,
	NPCScript_FollowWidget,
	NPCScript_PlayAnim,
	NPCScript_PlayAnimDone,
	NPCScript_LeadPlayer,
	SetText,
	StartConversation,
	EndConversation,
	Switch,
	AddText,
	ClearText,
	OpenTBox,
	CloseTBox,
	TalkBox_OnSignal0,
	TalkBox_OnSignal1,
	TalkBox_OnSignal2,
	TalkBox_OnSignal3,
	TalkBox_OnSignal4,
	TalkBox_OnSignal5,
	TalkBox_OnSignal6,
	TalkBox_OnSignal7,
	TalkBox_OnSignal8,
	TalkBox_OnSignal9,
	TalkBox_StopWait,
	TalkBox_OnStart,
	TalkBox_OnStop,
	Hit_Melee,
	Hit_BubbleBounce,
	Hit_BubbleBash,
	Hit_BubbleBowl,
	Hit_PatrickSlam,
	Hit_Throw,
	Hit_PaddleLeft,
	Hit_PaddleRight,
	TaskBox_Initiate,
	TaskBox_SetSuccess,
	TaskBox_SetFailure,
	TaskBox_OnAccept,
	TaskBox_OnDecline,
	TaskBox_OnComplete,
	GenerateBoulder,
	LaunchBoulderAtWidget,
	LaunchBoulderAtPoint,
	LaunchBoulderAtPlayer,
	DuploSuperDuperDone,
	DuploDuperIsDoner,
	BusStopSwitchChr,
	GroupUpdateTogether,
	SetUpdateDistance,
	TranslLocalX,
	TranslLocalY,
	TranslLocalZ,
	TranslWorldX,
	TranslWorldY,
	TranslWorldZ,
	RotLocalX,
	RotLocalY,
	RotLocalZ,
	RotWorldX,
	RotWorldY,
	RotWorldZ,
	TranslLocalXDone,
	TranslLocalYDone,
	TranslLocalZDone,
	TranslWorldXDone,
	TranslWorldYDone,
	TranslWorldZDone,
	RotLocalXDone,
	RotLocalYDone,
	RotLocalZDone,
	RotWorldXDone,
	RotWorldYDone,
	RotWorldZDone,
	Count1,
	Count2,
	Count3,
	Count4,
	Count5,
	Count6,
	Count7,
	Count8,
	Count9,
	Count10,
	Count11,
	Count12,
	Count13,
	Count14,
	Count15,
	Count16,
	Count17,
	Count18,
	Count19,
	Count20,
	SetState,
	EnterSpongeBob,
	EnterPatrick,
	EnterSandy,
	ExitSpongeBob,
	ExitPatrick,
	ExitSandy,
	NPCSpecial_PlatformSnap,
	NPCSpecial_PlatformFall,
	GooSetWarb,
	GooSetFreezeDuration,
	GooMelt,
	SetStateRange,
	SetStateDelay,
	SetTransitionDelay,
	NPCFightOn,
	NPCFightOff,
	NPCSplineOKOn,
	NPCSplineOKOff,
	NPCKillQuietly,
	HitHead,
	HitUpperBody,
	HitLeftArm,
	HitRightArm,
	HitLeftLeg,
	HitRightLeg,
	HitLowerBody,
	GiveCurrLevelSocks,
	GiveCurrLevelPickup,
	SetCurrLevelSocks,
	SetCurrLevelPickup,
	TalkBox_OnYes,
	TalkBox_OnNo,
	Hit_Cruise,
	DuploKillKids,
	TalkBox_OnSignal10,
	TalkBox_OnSignal11,
	TalkBox_OnSignal12,
	TalkBox_OnSignal13,
	TalkBox_OnSignal14,
	TalkBox_OnSignal15,
	TalkBox_OnSignal16,
	TalkBox_OnSignal17,
	TalkBox_OnSignal18,
	TalkBox_OnSignal19,
	SpongeballOn,
	SpongeballOff,
	LaunchShrapnel,
	NPCHPIncremented,
	NPCHPDecremented,
	NPCSetActiveOn,
	NPCSetActiveOff,
	PlrSwitchCharacter,
	LevelBegin,
	SceneReset,
	SceneEnter,
	SituationDestroyedTiki,
	SituationDestroyedRobot,
	SituationSeeWoodTiki,
	SituationSeeLoveyTiki,
	SituationSeeShhhTiki,
	SituationSeeThunderTiki,
	SituationSeeStoneTiki,
	SituationSeeFodder,
	SituationSeeHammer,
	SituationSeeTarTar,
	SituationSeeGLove,
	SituationSeeMonsoon,
	SituationSeeSleepyTime,
	SituationSeeArf,
	SituationSeeTubelets,
	SituationSeeSlick,
	SituationSeeKingJellyfish,
	SituationSeePrawn,
	SituationSeeDutchman,
	SituationSeeSandyBoss,
	SituationSeePatrickBoss,
	SituationSeeSpongeBobBoss,
	SituationSeeRobotPlankton,
	UIChangeTexture,
	NPCCheerForMe,
	FastVisible,
	FastInvisible,
	ZipLineMount,
	ZipLineDismount,
	Target,
	Fire,
	CameraFXShake,
	BulletTime,
	Thrown,
	UpdateAnimMatrices,
	EnterCruise,
	ExitCruise,
	CruiseFired,
	CruiseDied,
	CruiseAddLife,
	CruiseSetLife,
	CruiseResetLife,
	CameraCollideOff,
	CameraCollideOn,
	OnSliding,
	OffSliding,
	TimerSet,
	TimerAdd,
	NPCForceConverseStart,
	MakeASplash,
	CreditsStart,
	CreditsStop,
	CreditsEnded,
	BubbleWipe,
	SetLightKit,
	SetOpacity,
	TakeSocks,
	DispatcherAssert,
	Born,
	PlatPause,
	PlatUnpause,
	StoreOptions,
	RestoreOptions,
	Count
};