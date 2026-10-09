window.addEventListener('DOMContentLoaded',async()=>{
    while (typeof window.vw === 'undefined' && typeof window.vw.Map === 'undefined'){
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('🚩 [엔진 가동 완료]');
    vw.ws3dInitCallBack = F.Ws3dInitCallBack; //async function(){ G.ws3d_done = true; };
    G.map = new vw.Map();
    const options = {
        mapId: "vmap",
        initPosition: new vw.CameraPosition(new vw.CoordZ(G.OLPark.lon, G.OLPark.lat,G.OLPark.ele), new vw.Direction(0, -22, 1000)),
        logo: false,       
        navigation: true,
    };
    G.map.setOption(options);
    G.map.start();
    //console.log("vw.map.start()");
    await F.Wait3dmsDone();
    await F.Map.SetLayers();

    F.Event.VisibilityChange();
    F.Map.Event.ScreenSpace();
    await F.Cam.FlyTo(G.BackWoonDae,10);
    F.Run.GPS();
});
