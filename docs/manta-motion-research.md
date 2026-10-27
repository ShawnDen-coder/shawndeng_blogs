# 蝠鲼运动研究与当前动画差异

2026-10-27。用户反馈多次迭代后仍不自然，本轮先查证运动机制并对照实现；未据此宣称已完成写实运动。

## 直接资料

1. Fish et al. (2016), *Hydrodynamic Performance of Aquatic Flapping: Efficiency of Underwater Flight in the Manta*. https://www.mdpi.com/2226-4310/3/3/20 ，DOI: 10.3390/aerospace3030020。
   - 152 段、9 只个体的游动序列；上下拍不对称，同时存在展向与弦向的形变波。
   - 鳍根前部先动，翼尖滞后；翼尖还发生扭转。不能只用整片翼面的竖直位移表示。
   - 重建模型的下拍占周期约 0.43，上拍约 0.57；这是该模型的测量结果，不是所有蝠鲼的固定比例。
   - 模拟中上下拍均有推力峰值，下拍峰值约为上拍的 1.41 倍。不能把上拍强制定义成“无推力恢复”。
   - 慢速时上拍顶端存在滑行停留。
2. Fish et al. (2018), *Kinematics of swimming of the manta ray: three-dimensional analysis of open-water maneuverability*. https://journals.biologists.com/jeb/article/221/6/jeb166041/20833/Kinematics-of-swimming-of-the-manta-ray-three ，DOI: 10.1242/jeb.166041。
   - 7 只个体、30 段转向；记录拍翼频率 0.32±0.11 Hz。用作本场景慢速巡游的参考，不能当作物种速度上限。
   - 转弯既可由持续拍翼完成，也可由滑行中的侧倾完成。
   - 有动力转向时外侧翼的垂直摆幅大于内侧翼，研究记录比值 1.7±0.6；并非两翼始终对称、整体旋转即可。
   - 滑行在上拍末端，鳍面保持正上反角，身体纵向相对刚性。
   - 公开配套影片（已定位，未在工具内播放）：https://movie.biologists.com/video/10.1242/jeb.166041/video-1
3. Menzer et al. (2022), *Bio-Inspired Propulsion: Towards Understanding the Role of Pectoral Fin Kinematics in Manta-like Swimming*. https://pmc.ncbi.nlm.nih.gov/articles/PMC9036258/ ，DOI: 10.3390/biomimetics7020045。以同步高分辨率影像重建模型，分别研究翼面俯仰与弯曲，支持将两者作为不同形变处理。

## 当前实现的主要问题（代码对照与判断）

- `locomotion.ts` 固定循环五个阶段，且两次拍翼被压缩进约 3.5 秒。起承转合被写成固定节目单，缺少基于当前巡游/转弯需要的变化；这项是动画设计判断，不是论文的直接结论。
- `geometry.ts` 只改变翼面 Y，X/Z 在拍动时固定，没有翼面弦向俯仰、翼尖前后运动和真实扭转。小量延迟不能替代这些形变。
- 滑行的 lift 被归零，翼面几乎摊平，与资料中的上拍末端上反姿态不符。
- 推进函数只接受 drive 的下拍推力，上拍被当作纯减速；对应测试把错误假设固定成通过条件，应随模型一起改。
- 左右翼始终以 abs(u) 共用相同形变，转弯仅靠整体姿态，缺少内外侧翼差异。
- 身体侧倾由已产生的 turn 跟随得到，路径和姿态没有统一的转弯控制，仍有先整体旋转、再补侧倾的视觉风险。

## 下一版的依据

先校准单只蝠鲼的完整拍翼周期：稳定躯干、鳍根到翼尖的弯曲波、前缘到后缘的扭转、较快下拍与较慢上拍、上拍末端的可变停留。随后统一处理转弯中的侧倾、内外翼差异及路径曲率；最后恢复三只独立状态。保持用户确认的三只、斜仰视角、ASCII 表现与无水面光束约束。不能把通过数值边界检查等同于游动自然。
