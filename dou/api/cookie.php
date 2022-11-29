<?php  
// ini_set("display_errors", "On");//打开错误提示
// ini_set("error_reporting",E_ALL);//显示所有错误

header('Access-Control-Allow-Origin: *');
$json = file_exists('cookies.json') ? json_decode(file_get_contents('cookies.json'), true) : [];


$key = $_POST['key'];
$pwd = $_POST['pwd'];
$type = $_POST['type'];
$list = [];
foreach ($json as $k => $v) {
    if($v['key'] == $key){
        $data = [
            'url' => $v['url'],
            'date' => $v['date'],
            'data' => [],
            'index' => $k,
        ];
        foreach($v['data'] as $k1 => $v1){
            $data['data'][] = ['name' => $k1, 'value' => encrypt($v1, 'D', $pwd)];
        }
        $list[] = $data;
    }
}

switch($type){
    case 'list':
        echoJson(['code' => 'ok', 'data' => $list]);
        break;

    case 'remove':
    case 'upload':
        $url = $_POST['url'];
        foreach ($list as $k => $v) {
            if($v['url'] == $url){
                unset($json[$v['index']]); // 删除旧的
            }
        }
        if($type == 'upload'){
             $data = [];
            foreach($_POST['data'] as $v){
                $data[$v['name']] = encrypt(json_encode($v['value']), 'E', $pwd);
            }
            $json[] = [
                'url' => $url,
                'data' => $data,
                'key' => $key,
                'date' => time() . '000',
            ];
        }
        saveJson($json);
        echoJson(['code' => 'ok', 'msg' => $type == 'upload' ? '上传成功!' : '删除成功!']);
        break;
}

function encrypt($string,$operation,$key=''){   
    $key=md5($key);   
    $key_length=strlen($key);   
      $string=$operation=='D'?base64_decode($string):substr(md5($string.$key),0,8).$string;   
    $string_length=strlen($string);   
    $rndkey=$box=array();   
    $result='';   
    for($i=0;$i<=255;$i++){   
           $rndkey[$i]=ord($key[$i%$key_length]);   
        $box[$i]=$i;   
    }   
    for($j=$i=0;$i<256;$i++){   
        $j=($j+$box[$i]+$rndkey[$i])%256;   
        $tmp=$box[$i];   
        $box[$i]=$box[$j];   
        $box[$j]=$tmp;   
    }   
    for($a=$j=$i=0;$i<$string_length;$i++){   
        $a=($a+1)%256;   
        $j=($j+$box[$a])%256;   
        $tmp=$box[$a];   
        $box[$a]=$box[$j];   
        $box[$j]=$tmp;   
        $result.=chr(ord($string[$i])^($box[($box[$a]+$box[$j])%256]));   
    }   
    if($operation=='D'){   
        if(substr($result,0,8)==substr(md5(substr($result,8).$key),0,8)){   
            return substr($result,8);   
        }else{   
            return'';   
        }   
    }else{   
        return str_replace('=','',base64_encode($result));   
    }   
}   

function echoJson($data){
    echo json_encode($data);
}

function saveJson($data){
        file_put_contents('cookies.json', json_encode($data));

}

?>