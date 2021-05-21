# 中心型时空地图（Timespace Map）
传统地图依据地理空间距离进行绘制。但实际的城市生活，人们往往依赖交通工具出行，时间越来越代替空间成为考虑出行的第一决定性因素。

地图能否依据时间绘制呢？

通过文献调研确立了移动最小二乘法（moving-least-squares）作为对地图变形的方法。它能根据控制点集位置前后的变化，利用移动最小二乘原理生成原始图上其余点的位置。这样各个站点在依据时间距离重新排列的同时也能保留相当数量的地理空间信息。

文献引用：

1. 王丽娜, 李响, 江南, 杨振凯, & 杨飞. (2018). 中心型时间地图的构建方法与实现. 测绘学报, 47(1), 123.
2. Ullah, R., & Kraak, M. J. (2015). An alternative method to constructing time cartograms for the visual representation of scheduled movement data. Journal of Maps, 11(4), 674-687.

# Demo
[时空地图](https://jujiex.github.io/Timespace-Map/)

# 数据格式
数据分为两部分，一部分是地图图形；另一部分是铁路站点、信息。
为了重复使用绘制函数，将这两部分的数据都处理成类似如下结构：
```js
{ lines:{
        "1" : { points:[], colors:[] },
        "2" : { points:[], colors:[] }
        },
  points:{ 
         “A1” : { lon: , lat: },
         “A2” : { lon: , lat: }
         }
 }
```
# 功能实现
使用D3.js + HTML5 + CSS3布局图表、设定样式

通过D3.js绑定地铁站点/线路/地图图形数据，绘制相应SVG元素

捕获中心点触发事件，调用函数更新数据，刷新图形

绑定鼠标事件实现tooltip的信息浮层交互和图形的平移缩放