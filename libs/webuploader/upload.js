/**
 * 上传图片插件
 * @param  {object} paramData   包含下列参数的对象
 *             {string} url         上传图片地址 , 必须
 *             {string} name        input的name , 默认 'picture'
 *             {int}    num         最多上传图片数 , 默认1, 0为不限制数量
 *             {string} elm         jq选择器 , 默认 '#uploader'
 *             {int}    size        单文件最大上传大小 , 为空则不限制
 *             {array}  pic         已有图片 ['http://a.com/a.png','http://a.com/b.png'] 
 *                                     或 [{url:'http://a.com',path:'a.png'},{url:'http://a.com',path:'a.png'}] ,如果传入对象,src为对象里面的url+'/'+path , input的value为对象的JSON.stringify
 *             {string} base_url    根路径 <?=base_url()?>
 *             {object} param       参数 {path:'logo'}
 * 1. 引入
 * <link href="<?php  echo base_url('lib/js/webuploader/webuploader.css');?>" rel="stylesheet" type="text/css" />
 * <script src="<?php echo base_url('lib/js/webuploader/webuploader.min.js');?>"></script>
 * <script src="<?php echo base_url('lib/js/webuploader/upload.js');?>"></script>
 * 2. 新增DOM
 * <div id="uploader"></div>
 * 3. 实例化
 * init_upload({
        url      :'<?=site_url('systemconfig/upload/do_upload')?>',
        base_url :"<?=base_url()?>",
        param    :{path:'logo'}
 * });
 *------------------------
 * 2017-4-12 新增功能 : 如果需要更多图片信息,返回到info中,info包括path文件路径,在后端接受值后json_decode后获取到整个info对象
 */
 
// picCount = 0;
// // 添加的文件数量
// fileCount = 0;
// num="";
// flag="";

function init_upload(paramData) {
    var url      = paramData.url,
        name     = paramData.name,
        elm      = paramData.elm,
        size     = paramData.size,
        pic      = paramData.pic,
        base_url = paramData.base_url,
        param    = paramData.param,
        num      = paramData.num,
        status   = paramData.status,
        watch    = paramData.watch;
    if (!url || url=='') {
        //alert('url不能为空');
        swal({title: '提示!',text: 'url不能为空!',type: 'info'});
        return false;
    }
    if (!name || name=='') name = 'picture';
    var flag = name;
    if ((!num || num=='') && num!==0 ) num = 1;

    if (!elm || elm=='') elm = '#uploader';
    if (!base_url || base_url=='') base_url = '';
    if (!param || param=='') param = {};
    if (!pic || pic=='') pic = [];
    if (num!=1 ) name += '[]';

    var $wrap = $(elm);
    //添加dom
    $wrap.append('<div class="queueList">'+
                '<div id="dndArea'+flag+'" class="placeholder">'+
                    '<div id="filePicker'+flag+'"></div>'+
                '</div>'+
            '</div>'+
            '<div class="statusBar" style="display:none;">'+
                '<div class="uploader-progress">'+
                    '<span class="text">0%</span>'+
                    '<span class="percentage"></span>'+
                '</div><div class="info"></div>'+
                '<div class="btns">'+
                    '<div id="filePicker2'+flag+'" class="filePicker2"></div><div class="uploadBtn">开始上传</div>'+
                '</div>'+
            '</div>');

    // 图片容器
    var $queue = $( '<ul class="filelist"></ul>' )
            .appendTo( $wrap.find( '.queueList' ) ),

        // 状态栏，包括进度和控制按钮
        $statusBar = $wrap.find( '.statusBar' ),

        // 文件总体选择信息。
        $info = $statusBar.find( '.info' ),

        // 上传按钮
        $upload = $wrap.find( '.uploadBtn' ),

        // 没选择文件之前的内容。
        $placeHolder = $wrap.find( '.placeholder' ),

        $progress = $statusBar.find( '.uploader-progress' ).hide(),

        // // 原有图片数量
        picCount = 0,

        // // 添加的文件数量
        fileCount = 0,

        // 添加的文件总大小
        fileSize = 0,

        // 优化retina, 在retina下这个值是2
        ratio = window.devicePixelRatio || 1,

        // 缩略图大小
        thumbnailWidth = 110 * ratio,
        thumbnailHeight = 110 * ratio,

        // 可能有pedding, ready, uploading, confirm, done.
        state = 'pedding',

        // 所有文件的进度信息，key为file id
        percentages = {},
        // 判断浏览器是否支持图片的base64
        isSupportBase64 = ( function() {
            var data = new Image();
            var support = true;
            data.onload = data.onerror = function() {
                if( this.width != 1 || this.height != 1 ) {
                    support = false;
                }
            }
            data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            return support;
        } )(),

        // 检测是否已经安装flash，检测flash的版本
        flashVersion = ( function() {
            var version;

            try {
                version = navigator.plugins[ 'Shockwave Flash' ];
                version = version.description;
            } catch ( ex ) {
                try {
                    version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                            .GetVariable('$version');
                } catch ( ex2 ) {
                    version = '0.0';
                }
            }
            version = version.match( /\d+/g );
            return parseFloat( version[ 0 ] + '.' + version[ 1 ], 10 );
        } )(),

        supportTransition = (function(){
            var s = document.createElement('p').style,
                r = 'transition' in s ||
                        'WebkitTransition' in s ||
                        'MozTransition' in s ||
                        'msTransition' in s ||
                        'OTransition' in s;
            s = null;
            return r;
        })(),

        // WebUploader实例
        uploader;

    if ( !WebUploader.Uploader.support('flash') && WebUploader.browser.ie ) {

        // flash 安装了但是版本过低。
        if (flashVersion) {
            (function(container) {
                window['expressinstallcallback'] = function( state ) {
                    switch(state) {
                        case 'Download.Cancelled':
                            //alert('您取消了更新！')
                            swal({title: '提示!',text: '您取消了更新！',type: 'info'});
                            break;

                        case 'Download.Failed':
                            //alert('安装失败')
                            swal({title: '提示!',text: '安装失败!',type: 'info'});
                            break;

                        default:
                            //alert('安装已成功，请刷新！');
                            swal({title: '提示!',text: '安装已成功，请刷新!',type: 'info'});
                            break;
                    }
                    delete window['expressinstallcallback'];
                };

                var swf = './expressInstall.swf';
                // insert flash object
                var html = '<object type="application/' +
                        'x-shockwave-flash" data="' +  swf + '" ';

                if (WebUploader.browser.ie) {
                    html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                }

                html += 'width="100%" height="100%" style="outline:0">'  +
                    '<param name="movie" value="' + swf + '" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowscriptaccess" value="always" />' +
                '</object>';

                container.html(html);

            })($wrap);

        // 压根就没有安转。
        } else {
            $wrap.html('<a href="http://www.adobe.com/go/getflashplayer" target="_blank" border="0"><img alt="get flash player" src="http://www.adobe.com/macromedia/style_guide/images/160x41_Get_Flash_Player.jpg" /></a>');
        }

        return;
    } else if (!WebUploader.Uploader.support()) {
        //alert( 'Web Uploader 不支持您的浏览器！');
        swal({title: '提示!',text: 'Web Uploader 不支持您的浏览器!',type: 'info'});
        return;
    }

    // 实例化
    uploader = WebUploader.create({
        pick: {
            id: '#filePicker'+flag,
            label: '点击选择图片'
        },
        formData: param,
        // dnd: '#dndArea'+flag,
        paste: elm,
        swf: '../../dist/Uploader.swf',
        chunked: false,
        chunkSize: 512 * 1024,
        server: url,
        // runtimeOrder: 'flash',

        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        },

        // 禁止压缩
        compress : false,
        dnd:elm,//拖拽
        // 禁掉全局的拖拽功能。这样不会出现图片拖进页面的时候，把图片打开。
        disableGlobalDnd: true,
        fileNumLimit: num,
        fileSizeLimit: 200 * 1024 * 1024,    // 200 M
        fileSingleSizeLimit: size*1024    
    });

    // 拖拽时不接受 js, txt 文件。
    uploader.on( 'dndAccept', function( items ) {
        var denied = false,
            len = items.length,
            i = 0,
            // 修改js类型
            unAllowed = 'text/plain;application/javascript ';

        for ( ; i < len; i++ ) {
            // 如果在列表里面
            if ( ~unAllowed.indexOf( items[ i ].type ) ) {
                denied = true;
                break;
            }
        }

        return !denied;
    });

    // uploader.on('filesQueued', function() {
    //     uploader.sort(function( a, b ) {
    //         if ( a.name < b.name )
    //           return -1;
    //         if ( a.name > b.name )
    //           return 1;
    //         return 0;
    //     });
    // });

    // 添加“添加文件”的按钮，
    uploader.addButton({
        id: '#filePicker2'+flag,
        label: '继续添加'
    });

    uploader.on('ready', function() {
        window.uploader = uploader;
    });

    // 当有文件添加进来时执行，负责view的创建
    function addFile( file ) {
        var $li = $( '<li id="' + file.id + '">' +
                '<p class="title">' + file.name + '</p>' +
                '<p class="imgWrap"></p>'+
                '<p class="uploader-progress"><span></span></p>' +
                '<input type="hidden" name="'+name+'"/>'+
                '</li>' ),

            $btns = $('<div class="file-panel">' +
                '<span class="cancel" title="删除">删除</span>' +
                '<span class="move-first" title="移到首位">移到首位</span>' +
                '</div>').appendTo( $li ),
            $prgress = $li.find('p.uploader-progress span'),
            $wrap = $li.find( 'p.imgWrap' ),
            $info = $('<p class="error"></p>'),

            showError = function( code ) {
                switch( code ) {
                    case 'exceed_size':
                        text = '文件大小超出';
                        break;

                    case 'interrupt':
                        text = '上传暂停';
                        break;

                    default:
                        text = '上传失败';
                        break;
                }

                $info.text( text ).appendTo( $li );
            };

        if ( file.getStatus() === 'invalid' ) {
            showError( file.statusText );
        } else {
            // @todo lazyload
            $wrap.text( '预览中' );
            uploader.makeThumb( file, function( error, src ) {
                var img;

                if ( error ) {
                    $wrap.text( '不能预览' );
                    return;
                }

                if( isSupportBase64 ) {
                    img = $('<a href="#"><img src="'+src+'"></a>');
                    $wrap.empty().append( img );
                } else {
                    // 服务端预览,不需要
                    // $.ajax('../../server/preview.php', {
                    //     method: 'POST',
                    //     data: src,
                    //     dataType:'json'
                    // }).done(function( response ) {
                    //     if (response.result) {
                    //         img = $('<img src="'+response.result+'">');
                    //         $wrap.empty().append( img );
                    //     } else {
                            $wrap.text("预览出错");
                    //     }
                    // });
                }
            }, thumbnailWidth, thumbnailHeight );

            percentages[ file.id ] = [ file.size, 0 ];
            file.rotation = 0;
        }

        file.on('statuschange', function( cur, prev ) {
            if ( prev === 'progress' ) {
                $prgress.hide().width(0);
            } else if ( prev === 'queued' ) {
                // $li.off( 'mouseenter mouseleave' );
                // $btns.remove();
            }

            // 成功
            if ( cur === 'error' || cur === 'invalid' ) {
                showError( file.statusText );
                percentages[ file.id ][ 1 ] = 1;
            } else if ( cur === 'interrupt' ) {
                showError( 'interrupt' );
            } else if ( cur === 'queued' ) {
                percentages[ file.id ][ 1 ] = 0;
            } else if ( cur === 'progress' ) {
                $info.remove();
                $prgress.css('display', 'block');
            } else if ( cur === 'complete' ) {
                $li.append( '<span class="success"></span>' );
            }

            $li.removeClass( 'state-' + prev ).addClass( 'state-' + cur );
            if(watch){
                watchData();
            }
        });

        $li.on( 'mouseenter', function() {
            $btns.stop().animate({height: 30});
        });

        $li.on( 'mouseleave', function() {
            $btns.stop().animate({height: 0});
        });

        $btns.on( 'click', 'span', function() {
            var index = $(this).index(),
                deg;

            switch ( index ) {
                case 0:
                    uploader.removeFile( file );
                    updateTotalProgress();
                    return;

                case 1:
                    $li.prependTo($queue);
                    return;
                // case 1:
                //     file.rotation += 90;
                //     break;

                // case 2:
                //     file.rotation -= 90;
                //     break;
            }

            if ( supportTransition ) {
                deg = 'rotate(' + file.rotation + 'deg)';
                $wrap.css({
                    '-webkit-transform': deg,
                    '-mos-transform': deg,
                    '-o-transform': deg,
                    'transform': deg
                });
            } else {
                $wrap.css( 'filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation='+ (~~((file.rotation/90)%4 + 4)%4) +')');
                // use jquery animate to rotation
                // $({
                //     rotation: rotation
                // }).animate({
                //     rotation: file.rotation
                // }, {
                //     easing: 'linear',
                //     step: function( now ) {
                //         now = now * Math.PI / 180;

                //         var cos = Math.cos( now ),
                //             sin = Math.sin( now );

                //         $wrap.css( 'filter', "progid:DXImageTransform.Microsoft.Matrix(M11=" + cos + ",M12=" + (-sin) + ",M21=" + sin + ",M22=" + cos + ",SizingMethod='auto expand')");
                //     }
                // });
            }


        });
        $li.appendTo( $queue );
        if(watch){
            watchData();
        }
    }

    // 负责view的销毁
    function removeFile( file ) {
        var $li = $('#'+file.id);

        delete percentages[ file.id ];
        updateTotalProgress();
        $li.off().find('.file-panel').off().end().remove();
    }

    function updateTotalProgress() {
        var loaded = 0,
            total = 0,
            spans = $progress.children(),
            percent;

        $.each( percentages, function( k, v ) {
            total += v[ 0 ];
            loaded += v[ 0 ] * v[ 1 ];
        } );

        percent = total ? loaded / total : 0;


        spans.eq( 0 ).text( Math.round( percent * 100 ) + '%' );
        spans.eq( 1 ).css( 'width', Math.round( percent * 100 ) + '%' );
        updateStatus();
    }

    function updateStatus() {
        var text = '', stats;

        if ( state === 'ready' ) {
            text = '选中' + fileCount + '张图片，共' +
                    WebUploader.formatSize( fileSize ) + '。';
        } else if ( state === 'confirm' ) {
            stats = uploader.getStats();
            if ( stats.uploadFailNum ) {
                text = '已成功上传' + stats.successNum+ '张图片，'+
                    stats.uploadFailNum + '张图片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
            }

        } else {
            stats = uploader.getStats();
            text = '共' + fileCount + '张（' +
                    WebUploader.formatSize( fileSize )  +
                    '），已上传' + stats.successNum + '张';

            if ( stats.uploadFailNum ) {
                text += '，失败' + stats.uploadFailNum + '张';
            }
        }

        $info.html( text );
    }

    function setState( val ) {
        var file, stats;
        if ( val === state ) {
            return;
        }

        $upload.removeClass( 'state-' + state );
        $upload.addClass( 'state-' + val );
        state = val;

        switch ( state ) {
            case 'pedding':
                if (picCount == 0 ) {
                    $placeHolder.removeClass( 'element-invisible' );
                    $queue.hide();
                    $statusBar.addClass( 'element-invisible' );
                }
                uploader.refresh();
                break;

            case 'ready':
                $placeHolder.addClass( 'element-invisible' );
                if (num==0 || fileCount + picCount < num) 
                    $( '#filePicker2'+flag ).removeClass( 'element-invisible');
                $queue.show();
                $statusBar.removeClass('element-invisible');
                uploader.refresh();
                break;

            case 'uploading':
                $( '#filePicker2'+flag ).addClass( 'element-invisible' );
                $progress.show();
                $upload.text( '暂停上传' );
                break;

            case 'paused':
                $progress.show();
                $upload.text( '继续上传' );
                break;

            case 'confirm':
                $progress.hide();
                if (num==0 || fileCount + picCount < num) 
                    $( '#filePicker2'+flag ).removeClass( 'element-invisible' );
                $upload.text( '开始上传' );
                stats = uploader.getStats();
                if ( stats.successNum && !stats.uploadFailNum ) {
                    setState( 'finish' );
                    return;
                }
                break;
            case 'finish':
                stats = uploader.getStats();
                if ( stats.successNum ) {
                } else {
                    // 没有成功的图片，重设
                    state = 'done';
                    location.reload();
                }
                break;
        }

        updateStatus();
    }

    uploader.onUploadProgress = function( file, percentage ) {
        var $li = $('#'+file.id),
            $percent = $li.find('.uploader-progress span');
        $percent.css( 'width', percentage * 100 + '%' );
        if (percentages[ file.id ]) 
            percentages[ file.id ][ 1 ] = percentage;
        updateTotalProgress();
    };

    // 添加图片
    uploader.onFileQueued = function( file ) {
        if(status==1){
            fileCount=strCount.fileCount
        }
        fileCount++;
        if(status==1){
            strCount.fileCount=fileCount;
        }
        if (num!=0 && !(fileCount + picCount < num)) 
            $( '#filePicker2'+flag ).addClass( 'element-invisible');
        fileSize += file.size;

        if ( fileCount === 1 ) {
            $placeHolder.addClass( 'element-invisible' );
            $statusBar.show();
        }

        addFile( file );
        setState( 'ready' );
        updateTotalProgress();

        // if(pic && pic.length !=0){
        //     $.each(pic,function(i,d){
        //         if(d.original_name == file.name){
        //             fileCount++;
        //             fileSize += file.size;
        //             uploader.onFileDequeued(file);
        //             swal({title: '错误!',text: '上传图片重复',type: 'info'});
        //         }   
        //     })
        // }
    };

    // 删除图片
    uploader.onFileDequeued = function( file ) {
        if(status==1){
            fileCount=strCount.fileCount
        }
        fileCount--;
        fileSize -= file.size;
        if(status==1){
            strCount.fileCount=fileCount;
        }
        if ( !fileCount ) {
            setState( 'pedding' );
        }

        if (num!=0 && fileCount + picCount < num) 
            $( '#filePicker2'+flag ).removeClass( 'element-invisible');

        removeFile( file ); 
        updateTotalProgress();
        

    };

    uploader.on( 'all', function( type ) {
        var stats;
        switch( type ) {
            case 'uploadFinished':
                setState( 'confirm' );
                break;

            case 'startUpload':
                setState( 'uploading' );
                break;

            case 'stopUpload':
                setState( 'paused' );
                break;

        }
    });

    uploader.onError = function( code ) {
        var code2str = {
            Q_TYPE_DENIED       : '不支持该文件类型',
            Q_EXCEED_NUM_LIMIT  : '上传图片数量过多',
            Q_EXCEED_SIZE_LIMIT : '上传图片过大',
            F_EXCEED_SIZE       : '上传图片过大',
            F_DUPLICATE         : '上传图片重复',
        }
        if (code2str[code]) code = code2str[code];
        //alert( '错误: ' + code );
        swal({title: '错误!',text: code,type: 'info'});
    };

    $upload.on('click', function() {
        if ( $(this).hasClass( 'disabled' ) ) {
            return false;
        }

        if ( state === 'ready' ) {
            uploader.upload();
        } else if ( state === 'paused' ) {
            uploader.upload();
        } else if ( state === 'uploading' ) {
            uploader.stop();
        }
    });

    uploader.onUploadSuccess = function(file , rep) {
        if (typeof rep.path == 'string') {
            $("#" + file.id).find("input[name='"+name+"']").val(rep.path);
            $wrap.find('a').attr('href',base_url+rep.path).attr('target','_blank');
        }else {
            $("#" + file.id).find("input[name='"+name+"']").val(JSON.stringify(rep.info));
            if (!base_url && rep.info.url) 
                base_url = rep.info.url + '/';
            $wrap.find('a').attr('href',base_url+rep.info.path).attr('target','_blank');
        };
        if(rep && rep.info == 'sizeTooSmall'){
            //uploader.onFileDequeued(file);
            var fileId = file.id;
            if(fileId){
                $('#'+fileId).find('.success').removeClass('success');
            }
            swal({title: '错误!',text: '上传图片尺寸太小(最小500*500),请删除!',type: 'info'});
        }
        // if(pic && pic.length !=0){
        //     $.each(pic,function(i,d){
        //         if(d.original_name == file.name){
        //             fileCount++;
        //             fileSize += file.size;
        //             uploader.onFileDequeued(file);
        //             swal({title: '错误!',text: '上传图片重复',type: 'info'});
        //         }   
        //     })
        // }
    }

    $info.on( 'click', '.retry', function() {
        uploader.retry();
    } );

    $info.on( 'click', '.ignore', function() {
        $queue.find('.state-error').each(function() {
            uploader.removeFile( $(this).attr('id') );
        });
        updateStatus();
    } );

    $upload.addClass( 'state-' + state );
    updateTotalProgress();

    if (pic.length>0) {
        $.each(pic,function(k , v) {
            if (typeof v == 'string') {
                $pic_li = $('<li class="state-complete">' +
                        '<p class="title"></p>' +
                        '<p class="imgWrap">' +
                        '<a href="'+base_url + v+'" target="_blank"><img src="'+base_url + v+'" style="width:110px;height:110px"></a>'+
                        '</p>'+
                        '<p class="uploader-progress"><span></span></p>' +
                        '<input type="hidden" name="'+name+'" value="'+v+'"/>'+
                        '<div class="file-panel" style="height: 30px;">' +
                            '<span class="cancel" title="删除">删除</span>' +
                            '<span class="move-first" title="设为主图">设为主图</span>' +
                        '</div>'+
                        '<span class="success"></span>'+
                    '</li>');
            }else{
                $pic_li = $('<li class="state-complete">' +
                        '<p class="title"></p>' +
                        '<p class="imgWrap">' +
                        '<a href="'+ v.url +'/'+ v.path+'" target="_blank"><img src="'+ v.url +'/'+ v.path +'" style="width:110px;height:110px"></a>'+
                        '</p>'+
                        '<p class="uploader-progress"><span></span></p>' +
                        '<input type="hidden" name="'+name+'" value=\''+JSON.stringify(v)+'\'/>'+
                        '<div class="file-panel" style="height: 30px;">' +
                            '<span class="cancel" title="删除">删除</span>' +
                            '<span class="move-first" title="设为主图">设为主图</span>' +
                        '</div>'+
                        '<span class="success"></span>'+
                    '</li>');
            }
            $pic_li.find('.cancel').click(function() {
                // var hiddenPic=$(this).parent().parent().find('input[type="hidden"]').val();
                //     hiddenPic=$.parseJSON(hiddenPic);
                    
                // if(pic && pic.length !=0){
                //     $.each(pic,function(i,d){
                //         if(d.id == hiddenPic.id){
                //             pic.splice(i,1);
                //             return false;
                //         }
                        
                //     })
                // }
                $(this).parents('li').remove();
                picCount -= 1;
                if (num != 0) 
                    uploader.option('fileNumLimit',uploader.option('fileNumLimit')+1);
                // console.log(uploader.option('fileNumLimit'));
                
                $( '#filePicker2'+flag ).removeClass( 'element-invisible');
                if (picCount==0 && fileCount == 0) {
                    $placeHolder.removeClass( 'element-invisible' );
                    $queue.hide();
                    $statusBar.addClass( 'element-invisible' );
                    uploader.refresh();
                };
            });

            $pic_li.find('.move-first').click(function() {
                $(this).parents('li').prependTo($queue);
            });

            $queue.append($pic_li);
            picCount += 1;

        });

        if (picCount >= num && num != 0)
            $( '#filePicker2'+flag ).addClass( 'element-invisible' );
        if (num != 0)
            uploader.option('fileNumLimit',uploader.option('fileNumLimit')-picCount);
        $placeHolder.addClass('element-invisible');
        $statusBar.show();
    }
    strCount={
        picCount:picCount,
        fileCount:fileCount,
        num:num,
        flag:flag
    }
    return uploader;
}
