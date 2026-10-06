const F={
    Map:{
        SetLayers:function(){
            let allElement = G.map.getLayerAllElement();
            // _id, _name, visible
            // _id or _name
            G.map.getLayerElement("명칭").hide();
            G.map.getLayerElement('hybrid_silgam').hide()
            G.map.getLayerElement('facility_build').hide();
            G.map.getLayerElement('facility_build_all').show();
            G.map.getLayerElement('등산로').show()
            G.map.getLayerElement('등산로')._imageLayer.alpha= .8;
            G.map.getLayerElement('등산로')._imageLayer.brightness= .8;
            G.map.getLayerElement('등산로')._imageLayer.constrast= 1.5;
            G.map.getLayerElement('등산로')._imageLayer.saturation= .8;
            for(let i=0;i<allElement._array.length;i++){ if(allElement._array[i].visible) console.log(`name: ${allElement._array[i]._name}, id:${allElement._array[i]._id}, visible:${allElement._array[i].visible}`); }
        },

        Event: {
            ScreenSpace: function() {
                if (window.G.ScreenSpace.Event.handler) {
                    window.G.ScreenSpace.Event.handler.destroy();
                }

                window.G.ScreenSpace.Event.handler = new Cesium.ScreenSpaceEventHandler(ws3d.viewer.canvas);
                const viewer = ws3d.viewer;
                
                let longPressTimer = null;
                let isMoving = false;
                let touchStartX = 0;
                let touchStartY = 0;
                const overlay = document.getElementById('location-overlay');
                const coordText = document.getElementById('geo-coord-text');

                // 📱 [기능 1] 손가락을 대는 순간 (터치 다운)
                window.G.ScreenSpace.Event.handler.setInputAction(
                    function(movement) {
                        // [상충 차단벽] 자막창 활성화 중 터치 시 창만 즉시 닫기
                        if (overlay && overlay.style.display === 'block') {
                            overlay.style.display = 'none';
                            return; 
                        }

                        // 💡 [수정] 터치하면 오직 카메라 고정 락(trackedEntity)만 단독 해제합니다.
                        // (I 엔티티와 path 업데이트 로직에는 어떠한 영향도 주지 않습니다)
                        if (viewer.trackedEntity) {
                            console.log("📱 터치 드래그 감지: trackedEntity 연결 해제");
                            viewer.trackedEntity = undefined; 
                        }
                        window.G.GPS.is_tracked = false; 

                        isMoving = false;
                        touchStartX = movement.position.x;
                        touchStartY = movement.position.y;
                        if (longPressTimer) clearTimeout(longPressTimer);

                        // ⏳ 0.8초 롱프레스 대형 자막 시동
                        longPressTimer = setTimeout(function() {
                            if (!isMoving) {
                                const ray = viewer.camera.getPickRay(movement.position);
                                const carte3 = viewer.scene.globe.pick(ray, viewer.scene);

                                if (Cesium.defined(carte3)) {
                                    try {
                                        const carto = Cesium.Cartographic.fromCartesian(carte3);
                                        const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
                                        const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
                                        
                                        coordText.innerHTML = `위도: ${lat}<br>경도: ${lon}`;
                                        overlay.style.display = 'block';
                                        
                                        if (navigator.vibrate) navigator.vibrate(30); 
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }
                        }, 800);
                    },
                    Cesium.ScreenSpaceEventType.LEFT_DOWN
                );

                // 📱 [기능 2] 손가락을 떼는 순간
                window.G.ScreenSpace.Event.handler.setInputAction(
                    function(movement) {
                        if (longPressTimer) clearTimeout(longPressTimer);
                    },
                    Cesium.ScreenSpaceEventType.LEFT_UP
                );

                // 📱 [기능 3] 손가락 드래그 시 롱프레스 취소
                window.G.ScreenSpace.Event.handler.setInputAction(
                    function(movement) {
                        const deltaX = Math.abs(movement.endPosition.x - touchStartX);
                        const deltaY = Math.abs(movement.endPosition.y - touchStartY);
                        if (deltaX > 5 || deltaY > 5) {
                            isMoving = true;
                            if (longPressTimer) clearTimeout(longPressTimer);
                        }
                    },
                    Cesium.ScreenSpaceEventType.MOUSE_MOVE
                );

                // ⚡ [기능 4] 화면 탁탁 더블탭 시 수동 복귀 💡 [수정]
                window.G.ScreenSpace.Event.handler.setInputAction(
                    function(movement) {
                        console.log("⚡ 화면 더블탭 감지 완료! 즉시 복귀를 시도합니다.");
                        if (overlay) overlay.style.display = 'none';

                        if (window.G.GPS.iEntity) {
                            window.G.GPS.is_tracked = true;
                            
                            // 💡 flyTo 애니메이션 없이 setView로 내 마커 위치에 좌표와 각도를 즉시 셋팅(워프)합니다.
                            const currentPos = window.G.GPS.iEntity.position.getValue(viewer.clock.currentTime);
                            if (currentPos) {
                                viewer.camera.setView({
                                    destination: currentPos,
                                    orientation: {
                                        heading: viewer.camera.heading, // 보던 방향 유지
                                        pitch: Cesium.Math.toRadians(-35), // 입체적인 시야각 고정
                                        roll: 0.0
                                    }
                                });
                            }
                            
                            // 💡 setView 직후 trackedEntity에 내 마커 엔티티를 완벽하게 즉시 재결합합니다.
                            viewer.trackedEntity = window.G.GPS.iEntity;
                            console.log("🎯 trackedEntity 재연결 및 setView 복귀 완적 성공");
                        }
                    },
                    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
                );
            },

            Add: function() {
                // 모바일 환경에서는 키보드가 없으므로 에러 방지용 예외처리만 유지합니다.
                //window.addEventListener('keydown', function(key) { if (key.ctrlKey) G.Event.Key.ctrl = true; });
                //window.addEventListener('keyup', function(k) { if (k.ctrlKey) G.Event.Key.ctrl = false; });
                // 스크린 스페이스 핸들러 구동
                F.Map.Event.ScreenSpace();
            },

            OnClick:function(windowposition,ecef,carto,featureInfo){
                console.log(`windowposition: ${JSON.stringify(windowposition)}`);
                console.log(`ecef: ${JSON.stringify(ecef)}`);
                console.log(`carto radian: ${JSON.stringify(carto)},drees: ${carto.longitudeDD},${carto.latitudeDD},${carto.heightDD}`);
                if(featureInfo) console.log(`featureInfo: ${JSON.stringify(featureInfo)}`);
                else console.log('featureInfo: NULL'); 
                G.Event.OnClick.loc = Cesium.Cartesian3.fromRadians(carto.longitude,carto.latitude,carto.height);
                let test = new vw.CoordZ(vw.Util.toDegrees(carto.longitude), vw.Util.toDegrees(carto.latitude), 0);
                console.log(`cmp Cesium vw: ${JSON.stringify(G.Event.OnClick.loc)} ${JSON.stringify(test)}`);
            },
        },
        Marker:{
            Create: function(id,lon,lat,txt){
                if(G.map.getObjectById(id)){
                    console.log(`Alread Exist: Marker ${id}`);
                    return;
                }
                const text = `<div class="vworld-info-window"><p><h2>${txt}</h2></p></div>`; 
                console.log(`New Marker Set: ${text}`);
                G.map.createMarker(id,lon,lat,text,G.Marker.pinkpin,null,null,20);
            },
            Check: function(id){
                if(G.map.getObjectById(id)) return true;
                return false;
            },
            Remove: function(id){ G.map.removeObject(G.map.getObjectById(id));},
            Update: function(id,lon,lat,txt){
                if(F.Map.Marker.Check(id)) F.Map.Marker.Remove(id);
                F.Map.createMarker(id,lon,lat,txt);
            },
        },
    },
    GPS:{
        GetRealtimeGPS: function(){
            if('geolocation' in navigator){
                navigator.permissions.query({name: 'geolocation'}).then(p=>console.log(p.state));
                navigator.geolocation.watchPosition(
                    function success(pos){
                        const lon = pos.coords.longitude;
                        const lat = pos.coords.latitude;
                        let ele = pos.coords.altitude;
                        let alt=0;
                        if(ele < 1) alt = ws3d.viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon,lat,0));
                        else alt = ele;
                        console.log(`[GPS 수신] ${lon}, ${lat}, ${ele}`);
                        let cartesian_gps = Cesium.Cartesian3.fromDegrees(lon,lat,alt);
                        G.GPS.path.push(cartesian_gps);
                        if(G.GPS.iEntity){
                            G.GPS.iEntity.position = cartesian_gps;
                            console.log(`[GPS iEntity] ${lon}, ${lat}, ${ele}=>${alt}`);
                            //F.Map.Marker.Create('I',lon,lat,'Realtime GPS');
                        }
                    },
                    function error(err){
                        console.log(`[GPS 실패: ${err.code}, ${err.message}]`);
                    },
                    {
                        enableHighAccuracy: true, //true,
                        maximumAge: 0,
                        timeout: 30000
                    }
                );
            }
        },

        SetTrackedEntity:function(){
            const viewer = ws3d.viewer;
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            viewer.clock.shouldAnimate = false; 
            viewer.useDefaultRenderLoop = true; // for realtime rendering
            G.GPS.iEntity= ws3d.viewer.entities.add({
                name: 'I',
                position: Cesium.Cartesian3.fromDegrees(G.OLPark.lon,G.OLPark.lat,G.OLPark.ele),
                billboard:{
                    image:G.Marker.pinkpin,
                    width: 45,
                    height: 45,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    sizeInMeters: false,
                    scaleByDistance: new Cesium.NearFarScalar(1.5e2,1.5,1.5e3,1.0),
                },
            });
            G.GPS.pathEntity=ws3d.viewer.entities.add({
                name: 'Path',
                polyline:{
                    positions: new Cesium.CallbackProperty(()=>{return G.GPS.path;},false),
                    width: 30,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.25,
                        color: Cesium.Color.RED,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 4,
                    }),
                    clampToGround: true,
                    // 💡 [초강력 팁] 하늘 위 고고도 카메라에서도 경로가 무조건 보이도록
                    // 지면에서 공중으로 5미터 높이의 붉은 장벽(Wall) 라인을 투명도 60%로 함께 쳐줍니다.
                    wall: {
                    positions: new Cesium.CallbackProperty(() => window.G.GPS.path, false),
                    material: Cesium.Color.RED.withAlpha(0.6),
                    // 지형을 뚫고 솟아오르는 높이 정의 (구형 아이폰 사양 타협 최소화)
                    maximumHeights: new Cesium.CallbackProperty(() => {
                        return new Array(window.G.GPS.path.length).fill(20); // 지면 위 20미터 벽
                        }, false),
                    minimumHeights: new Array(window.G.GPS.path.length).fill(0)
                    }

                },
            });
            F.GPS.UpdateTrackedMode();
        },

        UpdateTrackedMode: function(){
            let viewer = ws3d.viewer;
            if(G.GPS.is_tracked){
                console.log('trackedEntity ON');
                viewer.trackedEntity = G.GPS.iEntity;
                F.GPS.GetRealtimeGPS();
            }else{
                console.log('trackedEntity OFF');
                viewer.trackedEntity = undefined;
                viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            }
        },
    },

    Test:{
        GPS: function(){
            G.GPS.is_tracked = true;
            F.GPS.SetTrackedEntity();
        },
        BoundingSphere_Orbit: function(lon,lat,ele,radius){
            F.Scene.BoundingSphere(lon, lat, ele,radius);
            recorder = F.Media.Recorder();
            F.Cam.Orbit(lon, lat, ele, radius, recorder);
            recorder.start(100);
        },
        JS: function(){
            const f = async function(){
                const p = new Promise(function(res){
                    res(10);
                });
                console.log('START: sync 내부 JS ');
                p.then(x=>console.log('then:',x));
                console.log('AFTER: sync 내부 then');
                console.log('async, await f:',await p);
                console.log('AFTER: sync 내부 await');
            };
            f();
            console.log('END');
        },
    },
    Media: {
        Recorder:function(){
            if(G.MediaRecorder === null){
                G.MediaRecorder = new MediaRecorder(
                    ws3d.viewer.scene.canvas.captureStream(60),
                    {
                        mimeType: 'video/webm;codecs=vp9',
                        videoBitsPerSecond: 5000000
                    }
                );
            }
            G.MediaRecorder.ondataavailable = function(x){
                if(x.data && x.data.size>0){
                    const reader = new FileReader();
                    reader.readAsDataURL(x.data);
                    reader.onloadend = function(){
                        const onlydata = reader.result.split(',')[1];
                        window.N_WriteBufferChunk(onlydata);
                    };
                }
            };
            G.MediaRecorder.onstop = function(){
                console.log('async 녹화중지');
                window.N_EndFileStream();
            };
            return G.MediaRecorder;
        },
    },
    Scene:{
        BoundingSphere:function(lon,lat,ele,radius){
            let viewer = ws3d.viewer;
            let pos_decalt = Cesium.Cartesian3.fromDegrees(lon,lat,ele);
            const boundingSphere = new Cesium.BoundingSphere(
                pos_decalt,
                radius);

            viewer.scene.globe.backFaceCulling = false;
            viewer.scene.globe.showSkirts = false;
            viewer.camera.viewBoundingSphere( boundingSphere, new Cesium.HeadingPitchRange(0, 0, boundingSphere.radius));
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

        },
        ClippingPlaneCollection:function(lon,lat,ele,radius){
            let viewer = ws3d.viewer;
            let pos_decalt = Cesium.Cartesian3.fromDegrees(lon,lat,ele);
            const boundingSphere = new Cesium.BoundingSphere(
                pos_decalt,
                radius);

            ws3d.viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
                modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(pos_decalt),
                planes: [
                    new Cesium.ClippingPlane(
                        new Cesium.Cartesian3(1.0, 0.0, 0.0),
                        radius
                    ),
                    new Cesium.ClippingPlane(
                        new Cesium.Cartesian3(-1.0, 0.0, 0.0),
                        radius
                    ),
                    new Cesium.ClippingPlane(
                        new Cesium.Cartesian3(0.0, 1.0, 0.0),
                        radius
                    ),
                    new Cesium.ClippingPlane(
                        new Cesium.Cartesian3(0.0, -1.0, 0.0),
                        radius
                    ),
                ],
                unionClippingRegions: true,
                edgeWidth: 1.0,
                edgeColor: Cesium.Color.WHITE,
                enabled: 1,
            });
            viewer.scene.globe.backFaceCulling = false;
            viewer.scene.globe.showSkirts = false;
            viewer.camera.viewBoundingSphere( boundingSphere, new Cesium.HeadingPitchRange(0, 0, boundingSphere.radius));
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

        },
    },
    Cam:{
        FlyTo:function(end_gpx, dt){
            return new Promise(function(resolve){
                //const s_cater3 = Cesium.Cartesian3.fromDegrees(start_gpx.lon,start_gpx.lat, start_gpx.ele);
                const e_cater3 = Cesium.Cartesian3.fromDegrees(end_gpx.lon,end_gpx.lat, end_gpx.ele);
                ws3d.viewer.clock.shouldAnimate = false;
                //ws3d.viewer.camera.setView({
                //    destination: s_cater3,
                //    orientation: {
                //        heading: Cesium.Math.toRadians(0),
                //        pitch: Cesium.Math.toRadians(0),
                //        roll: 0,},});
                //console.log("🎬 무대 감독: 올림픽공원 스탠바이 완료. 북한산 백운대로 flyTo 개시! 레디~ 액션!");
                ws3d.viewer.camera.flyTo({
                    destination: e_cater3,
                    orientation: { heading: Cesium.Math.toRadians(180), pitch: Cesium.Math.toRadians(0), roll: 0,},
                    duration: dt,
                    //maximumHeight: 5000,
                    //pitchAdjustHeight: 4000,
                    easingFunction: Cesium.EasingFunction.LINEAR,
                    complete:function(){
                        console.log("⛰️ 백운대 정상 착륙 성공! 슬레이트 탁! 백북한산 모의 주행/등반 시뮬레이션을 시작합니다!");
                        resolve();
                    },

                });
                ws3d.viewer.clock.shouldAnimate = true;
            });
        },

        // 🎬 시뮬레이션 연출가(Director) 컨트롤러 객체
        Director: {
            Ready: function(){
                // [Ready] 연출자가 스태프들에게 신호를 보냅니다.
                //const positionProperty = this.computeRoutePositionProperty(speed); // 필름(시간-좌표) 장착!
                //viewer.trackedEntity = this.trackedEntity; // 카메라 감독, 이 투명 점만 쫓아가!
                //this.createDroneViewArea(droneViewAngle); // 조명 감독, 드론 밑에 조명(가시 구역) 비춰!
            },

            // 액션!
            Action: function() {
                console.log("🎬 [Director] 레디... 액션!");
                ws3d.viewer.clock.startTime = this.startDate.clone();   // 시작! (0초 부근)
                ws3d.viewer.clock.stopTime = this.endDate.clone();     // 컷 예정 시간 설정
                ws3d.viewer.clock.currentTime = this.startDate.clone();  // 타임라인 바늘을 시작점으로 점프!
                ws3d.viewer.clock.shouldAnimate = true;                 // 🎬 영사기 가동! (배우와 카메라 동시 주행 시작)
            },// [Action] 슬레이트를 탁 치는 순간입니다!
            // 컷! (일시정지)
            Pause: function() {
                console.log("⏸️ [Director] 컷! 일시 정지.");
                ws3d.viewer.clock.shouldAnimate = false;
            },
            
            // 다시 고! (이어찍기)
            Resume: function() {
                console.log("▶️ [Director] 이어서 액션!");
                ws3d.viewer.clock.shouldAnimate = true;
            },
            
            // 배속 조절 (빨리 감기/느리게 감기)
            SpeedMultiplier: function(multiplier) {
                console.log(`⏩ [Director] 재생 속도 조절: ${multiplier}배속`);
                // 마스터 클락의 multiplier를 조절하면 드론과 카메라가 싱크를 유지한 채 다 같이 빨라집니다.
                ws3d.viewer.clock.multiplier = multiplier; 
            },
        },

        Orbit: function(lon,lat,ele,range,recorder){
            let viewer = ws3d.viewer;
            viewer.setting.renderQuality = 2; 
            viewer.useDefaultRenderLoop = true; // for realtime rendering
            viewer.scene.globe.enableLighting = true;

            const centerPosition = Cesium.Cartesian3.fromDegrees(lon, lat, ele*2/3);
            let t=0;
            const T= 10*60;
            const maxFrames = T*2;
            function Loop() {
                if(t > maxFrames){
                    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
                    recorder.stop();
                    return;
                }
                let angle = (t++)*2*Math.PI/T;
                let yaw = angle;
                let pitch = -5 * Math.PI/180 - (60*Math.PI/180)*(t/maxFrames); // + Math.PI/5 * Math.sin(angle);
                console.log(`pitch: ${pitch*180/Math.PI}`)
                //let pitch = (Math.PI/4)*(Math.cos(angle/8));
                viewer.camera.lookAt(
                    centerPosition,
                    new Cesium.HeadingPitchRange(yaw, pitch, range*2)
                );
                window.requestAnimationFrame(Loop);
            }
            Loop();
        },
    },
    Ws3dInitCallBack:async function(){
        let wmsLayer = new vw.Layers();
        console.log(`wmsLayer:${JSON.stringify(wmsLayer)}`);
        G.ws3d_done = true;
    },

    OrbitBackWoonDae: function(){
        let viewer = ws3d.viewer;
        viewer.setting.renderQuality = 2; 
        viewer.useDefaultRenderLoop = true; // for realtime rendering
        viewer.scene.globe.enableLighting = true;

        const centerPosition = Cesium.Cartesian3.fromDegrees(G.BackWoonDae.lon, G.BackWoonDae.lat, 700);
        G.OrbitBackWoonDae.x=0;
        G.OrbitBackWoonDae.angle=0;
        function Loop() {
            G.OrbitBackWoonDae.angle = (G.OrbitBackWoonDae.x++)*2*Math.PI/(60*5)
            viewer.camera.lookAt(
                centerPosition,
                new Cesium.HeadingPitchRange(G.OrbitBackWoonDae.angle/2, /*((Math.PI/4)*(Math.cos(G.OrbitBackWoonDae.angle/8)))*/2*Math.PI/180, 950)
            );
            window.requestAnimationFrame(Loop);
        }
        Loop();
    },

    Wait3dmsDone: async function(){
        while(1){
            if(G.ws3d_done === true)break;
            await new Promise(x=> setTimeout(x,50));
        }
    },
    WaitTileLoaded: async function(){
        return new Promise(function(res){
            if (ws3d.viewer.scene.globe.tilesLoaded) {
                return res(); 
            }
            const removeListener = ws3d.viewer.scene.globe.tilesLoadProgressEvent.addEventListener(function(tile_cnt){
                if(ws3d.viewer.scen.globe.tilesLoaded || tile_cnt === 0){
                    removeListener();
                    res();
                }
            });
        });
    },
}

if(typeof window !== 'undefined') {window.F=F;}
